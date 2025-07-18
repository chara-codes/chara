import { providersRegistry } from "../providers";

export const providersController = {
  list: () => {
    return Response.json(providersRegistry.getAvailableProviders());
  },
};
