// The warung's menu: seven ingredients on the counter and four dishes
// the order board can ask for. Every dish is three ingredients, and the
// ticket shows them in the order the cook should add them (any order
// works, but a wrong ingredient spoils the wok).
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#f7ead0', dark: '#cbb98a' },
  { id: 'mie', name: 'Mie', key: '2', color: '#f2c14e', dark: '#b98a1d' },
  { id: 'telur', name: 'Telur', key: '3', color: '#ff9f43', dark: '#c96a12' },
  { id: 'ayam', name: 'Ayam', key: '4', color: '#d35400', dark: '#8a3400' },
  { id: 'cabai', name: 'Cabai', key: '5', color: '#e74c3c', dark: '#96281b' },
  { id: 'sayur', name: 'Sayur', key: '6', color: '#27ae60', dark: '#145a32' },
  { id: 'kecap', name: 'Kecap', key: '7', color: '#6b4226', dark: '#3e2412' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

export const DISHES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', recipe: ['nasi', 'telur', 'cabai'],
    base: 120, cookSeconds: 2.5, plate: '#e67e22',
    blurb: 'Nasi wajan api besar, telur, cabai rawit.',
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam', recipe: ['mie', 'ayam', 'sayur'],
    base: 130, cookSeconds: 2.5, plate: '#f2c14e',
    blurb: 'Mie kenyal, ayam kecap, sayur segar.',
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', recipe: ['ayam', 'cabai', 'kecap'],
    base: 150, cookSeconds: 3.0, plate: '#a04000',
    blurb: 'Sate arang, sambal, kecap manis.',
  },
  {
    id: 'gado-gado', name: 'Gado-Gado', recipe: ['sayur', 'telur', 'kecap'],
    base: 110, cookSeconds: 2.0, plate: '#27ae60',
    blurb: 'Sayur rebus, telur, bumbu kacang.',
  },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((dish) => [dish.id, dish]));

export function dishNeeds(dish, wokContents) {
  return dish.recipe.filter((id) => !wokContents.includes(id));
}

export function isWrongIngredient(dish, ingredientId, wokContents) {
  return !dish.recipe.includes(ingredientId) || wokContents.includes(ingredientId);
}
