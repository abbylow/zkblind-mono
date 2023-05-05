import React from "react"

// TODO: change the data structure to adapt more than 1 group
// TODO: split feedback from this context
export type SemaphoreContextType = {
    _users: string[]
    _feedback: string[]
    refreshUsers: () => Promise<void>
    addUser: (user: string) => void
    refreshFeedback: () => Promise<void>
    addFeedback: (feedback: string) => void
}

export default React.createContext<SemaphoreContextType>({
    _users: [],
    _feedback: [],
    refreshUsers: () => Promise.resolve(),
    addUser: () => {},
    refreshFeedback: () => Promise.resolve(),
    addFeedback: () => {}
})
