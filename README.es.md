# Panel de Métricas Financieras

<!-- hide -->

Por [@marcogonzalo](https://github.com/marcogonzalo) y [otros contribuidores](https://github.com/4GeeksAcademy/ai-eng-financial-dashboard-context-project/graphs/contributors) en [4Geeks Academy](https://4geeksacademy.com/)

[![build by developers](https://img.shields.io/badge/build_by-Developers-blue)](https://4geeks.com)
[![4Geeks Academy](https://img.shields.io/twitter/follow/4geeksacademy?style=social&logo=x)](https://x.com/4geeksacademy)

_These instructions are [available in English](./README.md)._

**Antes de empezar**: 📗 [Lee las instrucciones](https://4geeks.com/es/lesson/como-comenzar-un-proyecto-de-codificacion) sobre cómo comenzar un proyecto de programación.

<!-- endhide -->

---

_Dashboard de métricas financieras con frontend en React + TypeScript y backend en FastAPI._

## Pasos recomendados

1. Haz un fork de este repositorio a tu cuenta.
2. Abre tu fork en GitHub Codespaces o clónalo y ejecútalo en tu entorno local.
3. Ejecuta tu agente de IA para inspeccionar frontend y backend.
4. Documenta las reglas propuestas y el banco de memoria en tu fork.
5. Ajusta y valida las reglas hasta que sean aplicables al flujo real del proyecto.

## Estructura esperada del directorio para agentes

```text
./.agents
└─ /rules
   └─ <nombre-regla>.md
└─ /skills
   └─ /<nombre-skill>
      └─ /SKILL.md
```

## Cómo ejecutar en local

```bash
docker compose up --build
```

El frontend usa por defecto el proxy de Vite para `/api`, así que no necesitas variables de entorno extra ni en desarrollo local ni en Codespaces.
Si necesitas apuntar a otro backend, copia `frontend/.env.example` como `.env` y define `VITE_API_BASE_URL`.

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## Auditoría con skills

Skills instaladas para GitHub Copilot en `.agents/skills/`, con sus fuentes fijadas
en `skills-lock.json`:

- [accessibility](.agents/skills/accessibility/SKILL.md), de `addyosmani/web-quality-skills`: WCAG 2.2, teclado, foco, alternativas textuales, contraste y ARIA.
- [vercel-react-best-practices](.agents/skills/vercel-react-best-practices/SKILL.md), de `vercel-labs/agent-skills`: rendimiento React, carga de datos, bundles y renderizado.

Se ejecutaron `npx skills find accessibility` y
`npx skills find vercel-react-best-practices`, se leyeron las instrucciones y se
pidió una auditoría de solo lectura al agente. Cada propuesta se contrastó con
el código y la skill antes de aceptarla:

| Decisión | Archivo real | Instrucción y evidencia |
| --- | --- | --- |
| Anunciar carga y errores; indicar el idioma español del error | [App.tsx](frontend/src/App.tsx) | `accessibility`: 3.1.1, 3.3.1 y 4.1.3. Faltaban anuncios de estado/error; el resto de la interfaz está en inglés. |
| Nombrar gráficos y ofrecer tablas equivalentes | [income-outcome-chart.tsx](frontend/src/components/dashboard/income-outcome-chart.tsx), [profit-percent-chart.tsx](frontend/src/components/dashboard/profit-percent-chart.tsx) | `accessibility`: 1.1 y 4.1.2. Los SVG interactivos tenían `role="application"` sin nombre y no había alternativa tabular. |
| Diferenciar gastos con una línea discontinua | [income-outcome-chart.tsx](frontend/src/components/dashboard/income-outcome-chart.tsx) | `accessibility`: no depender solo del color, sección de contraste. Las series solo se diferenciaban mediante color. |
| Reforzar el foco visible | [index.css](frontend/src/index.css) | `accessibility`: 2.4.7 y 1.4.11. El indicador original medía 2,04:1; ahora mide 4,69:1 sobre las tarjetas. |
| No añadir `aria-hidden` redundante ni `alt` a SVG | [dashboard-header.tsx](frontend/src/components/dashboard/dashboard-header.tsx), [kpi-card.tsx](frontend/src/components/dashboard/kpi-card.tsx) | `accessibility`: 1.1. Lucide ya genera `aria-hidden="true"`; no hay imágenes `<img>` en el dashboard actual. |
| No mover el fetch ni añadir loaders de Next.js | [App.tsx](frontend/src/App.tsx) | React: `bundle-analyzable-paths` trata rutas de importación, no la ubicación del fetch, que ya está fuera del componente. Esta app usa Vite, no Next.js. |
| No introducir lazy loading ni memoización especulativa | [App.tsx](frontend/src/App.tsx) | React: `bundle-dynamic-imports` se dirige a componentes pesados que no se necesitan inicialmente. Ambos gráficos pertenecen a la vista inicial; no se midió un beneficio de refactorizarlos. |
| No cambiar todo el idioma a español ni el título por el criterio 1.1 | [index.html](frontend/index.html) | `accessibility`: 3.1.1 exige el idioma real, aquí mayoritariamente inglés. La propuesta del título citaba 1.1, que trata alternativas textuales y no justifica ese cambio. |

Para repetir la verificación:

```bash
cd frontend
npm install
npx playwright install --with-deps chromium
npm run test:a11y
npm test
npm run lint
npm run build
```

La [prueba de accesibilidad](frontend/tests/accessibility.mjs) arranca su propio
servidor Vite y usa respuestas de API deterministas, sin requerir backend.
Comprueba Tab, Shift+Tab y flechas, ausencia de trampas de foco, nombres y roles,
tablas y valores, estados de carga/vacío/error, imágenes e iconos, contraste y axe
en escritorio (1440 px) y móvil (390 px). El reflow se comprueba a 720 px como
aproximación al zoom de navegador del 200 % en un escritorio de 1440 px.
Las capturas quedan en `/tmp/dashboard-a11y-1440.png` y
`/tmp/dashboard-a11y-390.png`.

Resultado: cero infracciones de axe en los cuatro estados, texto secundario
5,18:1 y foco 4,69:1. Esto no certifica conformidad WCAG completa: no se ha
realizado una prueba humana con lector de pantalla ni Windows High Contrast.

---

Este y muchos otros proyectos son construidos por estudiantes como parte de los [Coding Bootcamps](https://4geeksacademy.com/) de 4Geeks Academy. Encuentra más acerca de los [cursos](https://4geeksacademy.com/es/comparar-programas) de [Ingeniería de IA](https://4geeksacademy.com/es/coding-bootcamps/ingenieria-ia), [Data Science & Machine Learning](https://4geeksacademy.com/es/coding-bootcamps/curso-datascience-machine-learning), [Ciberseguridad](https://4geeksacademy.com/es/coding-bootcamps/curso-ciberseguridad) y [Full-Stack Software Developer con IA](https://4geeksacademy.com/es/coding-bootcamps/programador-full-stack).
