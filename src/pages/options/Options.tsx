import "@pages/options/Options.css";
import { useContext } from "react";
import { Theme, ThemeContext } from "../../theme/ThemeContext";

export default function Options(): JSX.Element {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <div className="container">
      <h1>Options</h1>
      <label>
        <span>Number of rows</span>
        <input type="number" min="2" max="6" />
      </label>
      <label>
        <span>Sort orders</span>
        <select name="sort-order" id="sort-order">
          <option value="date-added">Last added</option>
          <option value="date-last-viewed">Last viewed</option>
        </select>
      </label>
      <label>
        <span>Show preview image (when available)</span>
        <input type="checkbox" />
      </label>
      <label>
        Theme:
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as Theme)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
  );
}
