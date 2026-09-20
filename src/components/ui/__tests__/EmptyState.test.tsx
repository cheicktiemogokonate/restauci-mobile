import { EmptyState } from "@/components/ui/EmptyState";
import { fireEvent, render, screen } from "@testing-library/react-native";

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

describe("EmptyState", () => {
  it("affiche le titre, le message et l'emoji fournis", () => {
    render(
      <EmptyState emoji="🍽️" title="Aucun restaurant" message="Élargissez la zone" />,
    );

    expect(screen.getByText("Aucun restaurant")).toBeOnTheScreen();
    expect(screen.getByText("Élargissez la zone")).toBeOnTheScreen();
    expect(screen.getByText("🍽️")).toBeOnTheScreen();
  });

  it("utilise l'emoji par défaut et masque le message absent", () => {
    render(<EmptyState title="Vide" />);

    expect(screen.getByText("📭")).toBeOnTheScreen();
    expect(screen.queryByText(/./)).toBeTruthy();
  });

  it("déclenche onAction au lieu de la navigation quand il est fourni", () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Hors ligne"
        actionLabel="Réessayer"
        onAction={onAction}
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Réessayer" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas de bouton d'action sans libellé", () => {
    render(<EmptyState title="Vide" />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});
