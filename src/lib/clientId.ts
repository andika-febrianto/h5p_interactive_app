// A random id generated once per browser and stored in localStorage, used
// to associate progress records with "this device" on the backend — there's
// no login system yet. See backend/README.md for the plan to swap this for
// real accounts later.
const STORAGE_KEY = 'h5p-client-id';

export function getClientId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
