import { redirect } from "next/navigation"

export default async function Upload() {
  // Redirect to the create page which handles project naming
  // This maintains backward compatibility for any existing links
  redirect("/create")
}