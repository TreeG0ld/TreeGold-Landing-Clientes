import bcrypt from "bcryptjs";

// Coste de bcrypt. Vive aquí, en un único sitio, porque lo comparten el registro
// (que genera los hashes reales) y el hash señuelo de abajo: si dejaran de
// coincidir, el tiempo de respuesta volvería a distinguir "cuenta existente" de
// "cuenta inexistente" en el login.
export const PASSWORD_HASH_COST = 10;

// Hash señuelo contra el que se compara cuando NO hay usuario (o el usuario no
// tiene contraseña). Es un hash real de coste 10 generado con
// bcrypt.hash(<32 bytes aleatorios>, 10); la entrada aleatoria se descartó, así
// que ninguna contraseña casa con él.
export const DUMMY_PASSWORD_HASH =
  "$2b$10$IE.0QkTK1MM/FAnubEQCdu7korY7lc6lIxHeZn5zRWeRwwEvncRoa";

// Comprueba una contraseña ejecutando bcrypt SIEMPRE, exista o no el hash.
//
// Por qué importa: bcrypt.compare tarda ~65 ms en esta configuración. Si el
// login volviera antes de llamarlo cuando el correo no está en la base de
// datos, ese camino respondería en ~10 ms y el de "correo válido, contraseña
// mala" en ~70 ms. Los dos devuelven el MISMO 401 con el MISMO texto, pero la
// diferencia de 60 ms es un orden de magnitud mayor que el jitter de red:
// promediando unas pocas muestras se separan las cuentas que existen de las que
// no, con una precisión cercana al 100% y sin llegar a tocar el rate limit. Es
// decir, el mensaje de error único y la cubeta por cuenta no sirven de nada si
// el reloj responde por ellos.
export async function verifyPassword(
  password: string,
  hash: string | null | undefined
): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hash || DUMMY_PASSWORD_HASH);
  // El resultado del señuelo se descarta: nunca autentica a nadie.
  return Boolean(hash) && isValid;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_COST);
}
