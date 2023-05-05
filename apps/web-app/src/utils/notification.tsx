import { notifications } from "@mantine/notifications"
import { IconX, IconCheck } from "@tabler/icons-react"

export const notifyError = ({ title, message }: { title?: string, message: string }) => {
  notifications.show({
    title,
    message,
    color: "red",
    icon: <IconX />
  })
};

export const notifySuccess = ({ title, message }: { title?: string, message: string }) => {
  notifications.show({
    title,
    message,
    color: "teal",
    icon: <IconCheck />
  })
};