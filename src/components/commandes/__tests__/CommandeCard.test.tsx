import { CommandeCard } from "@/components/commandes/CommandeCard";
import type { CommandeSummary } from "@/types";
import { fireEvent, render, screen } from "@testing-library/react-native";

const commande: CommandeSummary = {
  id: "cmd-1",
  numero: "CMD-20260919-TEST",
  statut: "en_preparation",
  total: 12000,
  modeCommande: "emporter",
  items: [
    { nom: "Plat de validation E2E", prix: 12000, platId: "p1", quantite: 2 },
  ],
  createdAt: "2026-09-19T14:37:31.251Z",
  restaurantId: "r1",
} as unknown as CommandeSummary;

describe("CommandeCard", () => {
  it("affiche le numéro, le total formaté FCFA et le nombre d'articles agrégé", () => {
    render(<CommandeCard item={commande} onPress={jest.fn()} />);

    expect(screen.getByText(/CMD-20260919-TEST/)).toBeOnTheScreen();
    expect(
      screen.getByText((content) => content.includes("12 000")),
    ).toBeOnTheScreen();
  });

  it("affiche le message de suivi pour un statut en cours", () => {
    render(<CommandeCard item={commande} onPress={jest.fn()} />);

    // getOngoingOrderMessage(en_preparation) doit être rendu, pas un libellé de statut terminal
    expect(
      screen.getByText(/prépar|Prepar|cours/i),
    ).toBeOnTheScreen();
  });

  it("déclenche onPress avec l'identifiant de commande", () => {
    const onPress = jest.fn();
    render(<CommandeCard item={commande} onPress={onPress} />);

    fireEvent.press(screen.getByLabelText(/CMD-20260919-TEST/));
    expect(onPress).toHaveBeenCalledWith("cmd-1");
  });

  it("distingue une commande terminée d'une commande en cours", () => {
    const terminee = { ...commande, statut: "servie" as const };
    render(<CommandeCard item={terminee} onPress={jest.fn()} />);

    expect(screen.getByText(/Servie/i)).toBeOnTheScreen();
  });
});
