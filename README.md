# Administrador de Pagos

Sistema personal para registrar y hacer seguimiento de pagos mensuales de servicios.

## Stack

- **Backend**: NestJS + TypeORM + PostgreSQL + JWT
- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4
- **Infra**: Docker Compose

---

## Requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (viene incluido con Docker Desktop)

---

## Instalación y primer uso

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd administrador-pagos
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
DB_NAME=pagos_db
DB_USER=pagos_user
DB_PASS=tu_password_seguro

JWT_SECRET=tu_clave_secreta_larga

SEED_EMAIL=tu@email.com
SEED_PASSWORD=tu_password_de_acceso
SEED_NAME=Tu nombre
```

> El `SEED_EMAIL` y `SEED_PASSWORD` son las credenciales con las que vas a iniciar sesión en la app.

### 3. Levantar el sistema

```bash
docker compose up --build
```

La primera vez tarda unos minutos mientras descarga las imágenes y construye los contenedores.

### 4. Acceder

| Servicio  | URL                     |
|-----------|-------------------------|
| Frontend  | http://localhost:5173   |
| API       | http://localhost:3000   |

Iniciar sesión con el email y password que configuraste en el `.env`.

---

## Uso diario (sin reconstruir)

```bash
docker compose up
```

Para detener:

```bash
docker compose down
```

---

## Funcionalidades

### Períodos
Cada mes se registra como un **período**. Al crear uno podés cargar automáticamente todos los servicios predefinidos como pendientes, y después completar los montos.

### Servicios por período
Por cada servicio dentro de un período podés registrar:
- **Monto ARS** y/o **Monto USD** (soporta ambos en el mismo servicio, ej: tarjeta francés)
- **Estado**: pendiente / pagado / sin cargo / parcial
- **Vencimiento**
- **Medio de pago**: Mercado Pago, BBVA, débito automático, etc.
- **Notas** adicionales

### Dashboard
Vista rápida del período más reciente: total ARS, total USD, servicios pendientes y acceso directo a cada período.

### Reportes
- Gráfico de gastos mes a mes (ARS)
- Distribución por categoría (torta)
- Tabla comparativa anual con totales y pendientes por mes

### Configuración
Gestión de **servicios predefinidos** — los que se cargan automáticamente al crear un nuevo período. Podés activar/desactivar, editar o agregar nuevos.

**Servicios que vienen por defecto:**
BPN masterC, seguro, naranja, francés, celu, celu-noelia, internet, gas, afip, binance, mama, MAI, ATE, Alquiler, ingles (china), terapia Caball, contadora, terapias.

---

## Estructura del proyecto

```
administrador-pagos/
├── docker-compose.yml          # Desarrollo local
├── docker-compose.prod.yml     # Producción
├── .env                        # Variables dev (no commitear)
├── .env.example                # Plantilla dev
├── .env.prod.example           # Plantilla producción
├── nginx/
│   └── default.conf            # Config Nginx para producción
├── backend/
│   ├── src/
│   │   ├── auth/               # Login, JWT
│   │   ├── users/              # Usuario
│   │   ├── service-templates/  # Servicios predefinidos
│   │   ├── periods/            # Períodos mensuales
│   │   ├── payment-entries/    # Entradas de pago
│   │   └── reports/            # Reportes y estadísticas
│   ├── Dockerfile              # Desarrollo (hot reload)
│   └── Dockerfile.prod         # Producción (build optimizado)
└── frontend/
    ├── src/
    │   ├── pages/              # Login, Dashboard, Períodos, Reportes, Settings
    │   ├── components/         # Layout, EntryModal, ProtectedRoute
    │   ├── lib/                # API client, utilidades
    │   └── store/              # Auth store (Zustand)
    ├── Dockerfile              # Desarrollo (Vite dev server)
    └── Dockerfile.prod         # Producción (Vite build + Nginx)
```

---

## Despliegue en producción

### 1. Crear el archivo de entorno de producción

```bash
cp .env.prod.example .env.prod
```

Editá `.env.prod` con valores seguros — especialmente `DB_PASS` y `JWT_SECRET`:

```bash
# Generar un JWT_SECRET seguro
openssl rand -base64 48
```

### 2. Construir y levantar en modo producción

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

El flag `-d` corre los contenedores en background.

### 3. Acceder

Todo entra por el puerto 80 (o el que hayas configurado en `NGINX_PORT`):

| Servicio       | URL                    |
|----------------|------------------------|
| App completa   | http://tu-servidor     |
| API            | http://tu-servidor/api |

### Diferencias dev vs producción

| | Desarrollo | Producción |
|---|---|---|
| Frontend | Vite dev server (hot reload) | Build estático servido por Nginx |
| Backend | `nest start --watch` | NestJS compilado (`node dist/main`) |
| Puertos expuestos | 5174, 3005, 5433 | Solo 80 |
| Entrada de red | Dos servicios separados | Un solo Nginx |

### Comandos útiles en producción

```bash
# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Detener
docker compose -f docker-compose.prod.yml down

# Actualizar (nuevo deploy)
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

---

## Solución de problemas

**El contenedor de backend falla al iniciar**
Esperá a que postgres esté healthy. El healthcheck está configurado para reintentar automáticamente.

**Cambié el `.env` y no toma los cambios**
```bash
docker compose down && docker compose up --build
```

**Quiero resetear la base de datos**
```bash
docker compose down -v   # elimina el volumen de postgres
docker compose up --build
```

> ⚠️ Esto borra todos los datos.
