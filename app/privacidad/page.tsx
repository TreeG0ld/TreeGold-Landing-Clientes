import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos",
  description: `Cómo ${site.fullName} recoge, usa y protege tus datos personales, y cómo ejercer tus derechos (Ley 1581 de 2012).`,
  alternates: { canonical: "/privacidad" },
};

// Fecha de la última revisión del texto: cámbiala cada vez que se edite.
const ACTUALIZADA = "10 de octubre de 2026";

const resp = site.dataController;

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 md:px-8 md:pt-36">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="text-4xl md:text-5xl">Política de tratamiento de datos personales</h1>
      <p className="mt-4 text-sm text-secondary">Última actualización: {ACTUALIZADA}</p>

      <div className="mt-10 space-y-10 leading-relaxed text-secondary [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:text-primary [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        <p>
          Esta política explica qué datos personales recogemos en {site.fullName}, para qué los
          usamos y cómo puedes consultarlos, corregirlos o pedir que los eliminemos. Se expide
          conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y las demás normas
          colombianas de protección de datos personales.
        </p>

        <section>
          <h2>1. Responsable del tratamiento</h2>
          <ul>
            <li>
              <strong>Nombre:</strong> {resp.name} ({resp.idType} {resp.idNumber}), titular de{" "}
              {site.fullName}.
            </li>
            <li><strong>Dirección:</strong> {site.address}.</li>
            <li>
              <strong>Correo:</strong>{" "}
              <a className="text-accent hover:underline" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </li>
            <li><strong>Teléfono:</strong> {resp.phone}</li>
            <li><strong>Sitio web:</strong> treegold.shop</li>
          </ul>
        </section>

        <section>
          <h2>2. Qué datos recogemos</h2>
          <ul>
            <li>
              <strong>Al pagar en línea:</strong> nombre completo, correo electrónico, celular,
              departamento, ciudad, dirección de envío e indicaciones de entrega, y las piezas
              que compras.
            </li>
            <li>
              <strong>Al escribirnos por WhatsApp o correo:</strong> el número o correo desde el
              que escribes y el contenido de tu mensaje.
            </li>
            <li>
              <strong>Al navegar:</strong> datos técnicos y de uso mediante cookies (por ejemplo,
              Google Analytics), para entender cómo se usa la tienda.
            </li>
          </ul>
          <p className="mt-3">
            No vemos ni guardamos los datos de tu tarjeta o cuenta bancaria: el pago se hace en la
            página segura de Wompi. No recogemos datos sensibles ni pedimos datos de menores de
            edad; la tienda está dirigida a personas mayores de 18 años.
          </p>
        </section>

        <section>
          <h2>3. Para qué los usamos</h2>
          <ul>
            <li>Procesar y confirmar tu pedido, y cobrarlo a través de Wompi.</li>
            <li>Despachar y entregar tu pedido, y avisarte de su estado.</li>
            <li>Atender tus consultas, cambios, garantías y reclamos.</li>
            <li>Cumplir obligaciones legales, contables y tributarias.</li>
            <li>Mejorar la tienda con estadísticas de uso.</li>
          </ul>
        </section>

        <section>
          <h2>4. Con quién los compartimos</h2>
          <p>
            No vendemos tus datos. Solo los compartimos con quienes los necesitan para prestarte
            el servicio:
          </p>
          <ul className="mt-3">
            <li>
              <strong>Wompi (Bancolombia):</strong> procesa el pago. Recibe tu nombre, correo,
              celular y datos de envío.
            </li>
            <li>
              <strong>Empresas de mensajería o transporte:</strong> reciben nombre, celular y
              dirección para entregar tu pedido.
            </li>
            <li>
              <strong>Proveedores tecnológicos:</strong> alojamiento del sitio y de la base de
              datos, y Google Analytics para estadísticas. Algunos pueden estar fuera de
              Colombia, lo que implica transferencia o transmisión internacional de datos.
            </li>
            <li>
              <strong>Autoridades:</strong> cuando la ley o una orden judicial lo exijan.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Tus derechos</h2>
          <p>Como titular de los datos puedes:</p>
          <ul className="mt-3">
            <li>Conocer, actualizar y rectificar tus datos.</li>
            <li>Pedir prueba de la autorización que nos diste.</li>
            <li>Saber cómo hemos usado tus datos.</li>
            <li>
              Revocar la autorización y pedir que eliminemos tus datos, salvo que debamos
              conservarlos por una obligación legal o contractual.
            </li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
          </ul>
        </section>

        <section>
          <h2>6. Cómo ejercer tus derechos</h2>
          <p>
            Escríbenos a{" "}
            <a className="text-accent hover:underline" href={`mailto:${site.email}`}>
              {site.email}
            </a>{" "}
            indicando tu nombre, un medio para responderte y lo que solicitas. Las consultas se
            responden en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles; si
            necesitamos más tiempo, te avisamos antes con el motivo y la nueva fecha.
          </p>
        </section>

        <section>
          <h2>7. Seguridad y conservación</h2>
          <p>
            Aplicamos medidas técnicas y administrativas para proteger tus datos contra pérdida,
            acceso no autorizado o uso indebido. Los conservamos mientras sean necesarios para
            las finalidades de esta política y para cumplir obligaciones legales, contables y
            tributarias.
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <p>
            Usamos cookies para el funcionamiento de la tienda y para estadísticas de uso. Puedes
            bloquearlas o borrarlas desde la configuración de tu navegador; algunas funciones
            podrían dejar de funcionar.
          </p>
        </section>

        <section>
          <h2>9. Cambios a esta política</h2>
          <p>
            Si la modificamos, publicaremos la versión nueva en esta página con su fecha de
            actualización.
          </p>
        </section>

        <p className="text-sm">
          <Link href="/contacto" className="text-accent hover:underline">
            ¿Dudas? Contáctanos
          </Link>
        </p>
      </div>
    </div>
  );
}
