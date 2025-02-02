import { parsePath, WorkerError } from "../common.js"
import { verifyAuth } from "../auth.js"

export async function handleDelete(request, env, ctx) {
  const url = new URL(request.url)
  const { short, passwd } = parsePath(url.pathname)
  // only admin can delete
  const authResponse = verifyAuth(request, env)
  if (authResponse) {
    return authResponse
  }
  const item = await env.PB.getWithMetadata(short)
  if (item.value === null) {
    throw new WorkerError(404, `paste of name '${short}' not found`)
  } else {
    //if (passwd !== item.metadata?.passwd) {
    //  throw new WorkerError(403, `incorrect password for paste '${short}`)
    //} else {
    await env.PB.delete(short)
    return new Response("the paste will be deleted in seconds")
    //}
  }
}
