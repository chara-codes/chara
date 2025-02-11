import { trpc } from ".";

async function main() {
  const stack = await trpc.stacks.create.mutate({
    title: `title ${Math.random()}`,
    description: `description ${Math.random()}`,
  });
  const link = await trpc.lnks.add.mutate({
    title: "Next.js",
    url: "https://nextjs.org/docs",
    stackId: stack.id,
  });
  console.log(link);
}

if (import.meta.main) {
  main();
}
