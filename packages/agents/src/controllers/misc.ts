export const miscController = {
  notFound: () => Response.json({ message: "Not found" }, { status: 404 }),
  fallback: () =>
    new Response("Not Found", {
      status: 404,
    }),
};
