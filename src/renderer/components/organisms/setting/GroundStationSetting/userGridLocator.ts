import GridLocatorService from "@/renderer/service/GridLocatorService";

export default function useGridLocator() {
  const gridLocatorService = new GridLocatorService();

  function fromGridLocator(gridLocator: string) {
    const { lat, lon } = gridLocatorService.fromGridLocator(gridLocator);
    return { lat, lon };
  }

  return { fromGridLocator };
}
