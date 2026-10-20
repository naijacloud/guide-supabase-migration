/**
 * A 303 to a path on this site. A relative Location, because behind the
 * platform's proxy `req.url` is the container's own address
 * (http://localhost:3000), and new URL('/', req.url) would send the browser
 * there.
 */
export const seeOther = (path: string) => new Response(null, { status: 303, headers: { Location: path } });
