import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MentionInput } from "../src/mention-input.js"
import type { Person } from "../src/mention.js"

const PEOPLE: Person[] = [
  { id: "u1", name: "Ada Lovelace", handle: "ada", detail: "Engineering", badge: "Owner" },
  { id: "u2", name: "Grace Hopper", handle: "grace", detail: "Platform" },
  { id: "u3", name: "Alan Turing", handle: "alan", detail: "Research" },
]

const label = "Comment"
const box = () => screen.getByLabelText(label) as HTMLTextAreaElement

describe("MentionInput — picker", () => {
  it("opens on @ and filters as you type", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} />)

    await user.type(box(), "hey @")
    expect(screen.getAllByRole("option")).toHaveLength(3)

    await user.type(box(), "gr")
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1))
    expect(screen.getByRole("option")).toHaveTextContent("Grace Hopper")
  })

  it("does not open inside an email address", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} />)

    await user.type(box(), "mail me at user@example")
    expect(screen.queryByRole("option")).not.toBeInTheDocument()
  })

  it("inserts the handle on click and leaves a trailing space", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} />)

    await user.type(box(), "hey @ad")
    await user.click(screen.getByRole("option", { name: /Ada Lovelace/ }))

    expect(box()).toHaveValue("hey @ada ")
  })

  it("navigates and selects with the keyboard", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} />)

    await user.type(box(), "@")
    await user.keyboard("{ArrowDown}{Enter}")

    expect(box().value).toContain("@grace")
  })

  it("closes on Escape", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} />)

    await user.type(box(), "@a")
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0)

    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("option")).not.toBeInTheDocument())
  })

  it("announces suggestions without claiming an invalid role", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} />)

    // This test previously asserted role="combobox". axe was right and the
    // test was wrong: ARIA 1.2 permits that role on <input>, not on a
    // multi-line control. A textarea is already a textbox, which legitimately
    // supports aria-activedescendant; the suggestion count is announced by a
    // polite live region instead.
    expect(box()).not.toHaveAttribute("role", "combobox")

    await user.type(box(), "@")
    await waitFor(() => expect(box()).toHaveAttribute("aria-activedescendant"))
    expect(box()).toHaveAttribute("aria-controls")

    const status = screen.getByRole("status")
    expect(status).toHaveTextContent(/people available|person available/)
  })

  it("renders the rich layout with avatar and badge", async () => {
    const user = userEvent.setup()
    render(<MentionInput label={label} people={PEOPLE} layout="rich" />)

    await user.type(box(), "@ada")
    expect(screen.getByText("AL")).toBeInTheDocument()
    expect(screen.getByText("Owner")).toBeInTheDocument()
    expect(screen.getByText(/@ada · Engineering/)).toBeInTheDocument()
  })
})

describe("MentionInput — value", () => {
  it("emits text and the ids present in it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MentionInput label={label} people={PEOPLE} onChange={onChange} />)

    await user.type(box(), "hey @ada")
    await user.click(screen.getByRole("option", { name: /Ada Lovelace/ }))

    expect(onChange).toHaveBeenLastCalledWith({ text: "hey @ada ", ids: ["u1"] })
  })

  it("drops the id when the mention is edited out", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <MentionInput
        label={label}
        people={PEOPLE}
        defaultValue={{ text: "hey @ada", ids: ["u1"] }}
        onChange={onChange}
      />,
    )

    await user.click(box())
    await user.keyboard("{Backspace}{Backspace}{Backspace}")

    // Editing the handle away must remove the notification with it.
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ ids: [] }),
    )
  })

  it("enforces maxMentions, capping notification blast radius", async () => {
    const user = userEvent.setup()
    render(
      <>
        <MentionInput
          label={label}
          people={PEOPLE}
          maxMentions={1}
          defaultValue={{ text: "@ada @grace", ids: ["u1", "u2"] }}
        />
        <button type="button">outside</button>
      </>,
    )

    await user.click(box())
    await user.click(screen.getByRole("button", { name: "outside" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(/no more than 1/i)
  })

  it("submits the text through FormData", async () => {
    const user = userEvent.setup()
    render(
      <form data-testid="f">
        <MentionInput label={label} people={PEOPLE} name="comment" />
      </form>,
    )

    await user.type(box(), "hello there")
    const fd = new FormData(screen.getByTestId("f") as HTMLFormElement)
    expect(fd.get("comment")).toBe("hello there")
  })
})
