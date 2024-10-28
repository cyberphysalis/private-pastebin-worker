import { makeMarkdown } from "./markdown.js"
import { verifyAuth } from "../auth.js"

import indexHtml from "../../frontend/index.html"
import styleCss from "../../frontend/style.css"
import adminHtml from "../../frontend/admin.html"
import adminJs from "../../frontend/admin.client.js"
import editorHtml from "../../frontend/editor.html"
import editorJs from "../../frontend/editor.client.js"
import editorStyleCss from "../../frontend/editor.style.css"
import tosMd from "../../frontend/tos.md"
import apiMd from "../../doc/api.md"

function indexPage(env) {
  return indexHtml
    .replace("{{ROOT_CSS}}", styleCss)
    .replaceAll("{{BASE_URL}}", env.BASE_URL)
    .replaceAll("{{REPO}}", env.REPO)
    .replaceAll("{{FAVICON}}", env.FAVICON)
}

function adminPage(env) {
  env.PB.list
  return adminHtml
    .replace("{{ROOT_CSS}}", styleCss)
    .replace("{{ADMIN_JS}}", adminJs)
    .replaceAll("{{BASE_URL}}", env.BASE_URL)
    .replaceAll("{{PASTEBIN_KEYS}}", env.REPO)
    .replaceAll("{{FAVICON}}", env.FAVICON)
}

function editorPage(env) {
  return editorHtml
    .replace("{{ROOT_CSS}}", styleCss)
    .replace("{{EDITOR_CSS}}", editorStyleCss)
    .replace("{{EDITOR_JS}}", editorJs)
    .replaceAll("{{BASE_URL}}", env.BASE_URL)
    .replaceAll("{{REPO}}", env.REPO)
    .replaceAll("{{FAVICON}}", env.FAVICON)
}

function staticPageResponse(content, env) {
  const age = env.CACHE_STATIC_PAGE_AGE
  const moreheaders = age ? { "cache-control": `public, max-age=${age}` } : {}
  return new Response(content, {
    headers: { "content-type": "text/html;charset=UTF-8", ...moreheaders },
  })
}

function requireAuthResponse(content, request, env) {
  const authResponse = verifyAuth(request, env)
  if (authResponse !== null) {
    return authResponse
  }
  return staticPageResponse(content, env)
}

export function getStaticPage(path, request, env) {
  if (path === "/" || path === "/index" || path === "/index.html") {
    return staticPageResponse(indexPage(env), env)
  } else if (path === "/tos" || path === "/tos.html") {
    const tosMdRenderred = tosMd
      .replaceAll("{{TOS_MAINTAINER}}", env.TOS_MAINTAINER)
      .replaceAll("{{TOS_MAIL}}", env.TOS_MAIL)
      .replaceAll("{{BASE_URL}}", env.BASE_URL)

    return staticPageResponse(tosMdRenderred, env)
  } else if (path === "/api" || path === "/api.html") {
    return staticPageResponse(makeMarkdown(apiMd), env)
  }

  // pages that require auth
  if (path === "/e" || path === "/e.html" || path.startsWith("/e/")) {
    return requireAuthResponse(editorPage(env), request, env)
  } else if (path === "/m" || path === "/m.html") {
    return requireAuthResponse(adminPage(env), request, env)
  } else {
    return null
  }
}
