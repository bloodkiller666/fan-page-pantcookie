# Solución: Error "Acceso denegado" en Turbopack (Next.js)

## 🔴 Problema
```
Error [TurbopackInternalError]: Acceso denegado. (os error 5)
```

Este error ocurre cuando Turbopack no tiene permisos para acceder a archivos temporales en Windows.

---

## ✅ Solución Inmediata

### Paso 1: Cerrar todo
- Cierra VSCode, editores de código y terminales abiertas
- Asegúrate de que no haya procesos de Node.js ejecutándose

### Paso 2: Limpiar e instalar (PowerShell como Administrador)
```powershell
# Navega al proyecto
cd C:\Users\LENOVO\Desktop\Fan-Page\pantcookie-app

# Limpia caché y archivos temporales
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Reinstala dependencias
npm install

# Ejecuta el servidor
npm run dev
```

### Paso 3: Si el error persiste

#### Opción A: Deshabilitar Turbopack
```powershell
npm run dev -- --no-turbo
```

#### Opción B: Agregar exclusión en Windows Defender
1. Abre **Windows Security** → **Protección contra virus y amenazas**
2. **Configuración de protección** → **Exclusiones** → **Agregar exclusión**
3. Agrega estas carpetas:
   - `C:\Users\LENOVO\Desktop\Fan-Page\pantcookie-app`
   - `C:\Users\LENOVO\AppData\Local\Temp`

#### Opción C: Ejecutar siempre como Administrador
- Click derecho en PowerShell → **Ejecutar como administrador**
- Luego ejecuta `npm run dev`

---

## 🚀 Para Transferir a Otra Computadora (SIN ERRORES)

### ✅ QUÉ COPIAR:
```
✓ Archivos de código fuente (src/, public/)
✓ Archivos de configuración (package.json, next.config.js, etc.)
✓ .env.local (si contiene variables de entorno)
✓ README.md y documentación
```

### ❌ QUÉ NO COPIAR:
```
✗ node_modules/     ← Nunca copiar
✗ .next/            ← Nunca copiar
✗ .turbo/           ← Nunca copiar
✗ package-lock.json ← Opcional (se regenera)
```

### 📋 Proceso de transferencia:

#### En la computadora ORIGEN:
```powershell
# 1. Asegúrate de tener un .gitignore actualizado (ya está listo)
# 2. Copia solo los archivos necesarios (sin node_modules ni .next)
# 3. Si usas Git:
git add .
git commit -m "Proyecto listo para transferir"
git push
```

#### En la computadora DESTINO:
```powershell
# 1. Clona o copia el proyecto (sin node_modules ni .next)
cd ruta/del/proyecto

# 2. Instala dependencias LIMPIAS
npm install

# 3. Copia el archivo .env.local (si es necesario)
# 4. Ejecuta el proyecto
npm run dev
```

---

## 🛡️ Prevención de Errores Futuros

### 1. Siempre usar .gitignore correcto
El archivo `.gitignore` ya está actualizado con:
- `node_modules/`
- `.next/`
- `.turbo/`
- Archivos temporales y caché

### 2. Nunca transferir carpetas de dependencias
- Siempre ejecuta `npm install` en la nueva computadora
- Nunca copies `node_modules` manualmente

### 3. Configurar Windows Defender
- Agrega exclusiones para tus proyectos de desarrollo
- Evita escaneos en tiempo real en carpetas de proyectos

### 4. Usar Git para transferencias
```bash
# Método recomendado:
git clone <repositorio>
cd proyecto
npm install
npm run dev
```

---

## 📝 Comandos Útiles

### Limpiar completamente el proyecto:
```powershell
Remove-Item -Recurse -Force .next, node_modules, .turbo -ErrorAction SilentlyContinue
npm install
```

### Verificar permisos de carpeta:
```powershell
icacls "C:\Users\LENOVO\Desktop\Fan-Page\pantcookie-app"
```

### Ejecutar sin caché:
```powershell
npm run dev -- --no-turbo
```

---

## 🔍 Causas Comunes del Error

1. **Antivirus bloqueando archivos** → Agregar exclusiones
2. **Permisos insuficientes** → Ejecutar como administrador
3. **Caché corrupto** → Eliminar `.next` y `.turbo`
4. **Archivos bloqueados** → Cerrar editores y procesos
5. **node_modules copiados** → Reinstalar con `npm install`

---

## ✨ Resumen Rápido

**Para solucionar AHORA:**
```powershell
Remove-Item -Recurse -Force .next, node_modules -ErrorAction SilentlyContinue
npm install
npm run dev
```

**Para transferir a otra PC:**
1. NO copies `node_modules` ni `.next`
2. Copia solo código fuente y configuración
3. En la nueva PC: `npm install` → `npm run dev`
4. Usa Git si es posible

---

**¿Aún tienes problemas?** Verifica:
- [ ] ¿Ejecutaste PowerShell como administrador?
- [ ] ¿Eliminaste completamente `.next` y `node_modules`?
- [ ] ¿Windows Defender está bloqueando archivos?
- [ ] ¿Hay procesos de Node.js ejecutándose en segundo plano?
