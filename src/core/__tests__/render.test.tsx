import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

describe("React Native Testing Library", () => {
  it("renderiza un componente y lo encuentra por su texto", async () => {
    await render(<Text>El Quijote</Text>);

    expect(screen.getByText("El Quijote")).toBeOnTheScreen();
  });
});
