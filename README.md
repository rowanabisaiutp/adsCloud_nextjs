# 📢 WebSocket Ads System

Sistema de anuncios publicitarios en tiempo real con WebSocket, Next.js y SQLite.

## 🚀 Inicio Rápido

```bash
pnpm install
pnpm dev
```

Servidor: `http://localhost:3000`

---

## 📁 Estructura

```
├── app/                    # Next.js App Router
│   ├── api/ads/            # API REST
│   └── page.jsx            # Panel de administración
├── lib/db.js               # Base de datos SQLite
├── public/
│   ├── ad-widget.js        # SDK para integración
│   └── test.html           # Página de pruebas
├── data/ads.db             # Base de datos
└── server.js               # Servidor con WebSocket
```

---

## 🔌 API REST

| Método   | Endpoint          | Descripción               |
| -------- | ----------------- | ------------------------- |
| `GET`    | `/api/ads`        | Listar todos los anuncios |
| `GET`    | `/api/ads/active` | Solo anuncios activos     |
| `POST`   | `/api/ads`        | Crear anuncio             |
| `PUT`    | `/api/ads/:id`    | Actualizar anuncio        |
| `DELETE` | `/api/ads/:id`    | Eliminar anuncio          |

### Ejemplo: Crear anuncio

```bash
curl -X POST http://localhost:3000/api/ads \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Oferta Especial",
    "content": "50% de descuento",
    "image_url": "https://ejemplo.com/banner.jpg",
    "link_url": "https://ejemplo.com/oferta",
    "type": "banner",
    "options": {
      "show_button": true,
      "button_text": "Comprar",
      "button_url": "https://ejemplo.com/comprar"
    }
  }'
```

---

## 🌐 WebSocket

### Conexión

```javascript
const socket = io("http://localhost:3000");
```

### Eventos recibidos (del servidor)

| Evento         | Datos                | Descripción                |
| -------------- | -------------------- | -------------------------- |
| `ads_update`   | `{ ads: Ad[] }`      | Lista completa de anuncios |
| `ad_created`   | `{ ad: Ad }`         | Nuevo anuncio creado       |
| `ad_updated`   | `{ ad: Ad }`         | Anuncio actualizado        |
| `ad_deleted`   | `{ id: number }`     | Anuncio eliminado          |
| `ad_click`     | `{ id, clicks }`     | Click registrado           |
| `notification` | `{ title, message }` | Push notification          |

### Eventos enviados (al servidor)

| Evento              | Datos                      | Descripción         |
| ------------------- | -------------------------- | ------------------- |
| `get_ads`           | -                          | Solicitar anuncios  |
| `ad_click`          | `{ adId: number }`         | Registrar click     |
| `push_notification` | `{ title, message, type }` | Enviar notificación |

---

## 📱 Integración en Aplicaciones

### 1. Widget HTML (Más simple)

```html
<script
  src="http://localhost:3000/ad-widget.js"
  data-server="http://localhost:3000"
  data-container="ad-container"
  data-type="banner"
></script>
<div id="ad-container"></div>
```

**Parámetros:**

- `data-server`: URL del servidor
- `data-container`: ID del contenedor
- `data-type`: `banner` | `popup` | `sidebar`

---

### 2. JavaScript/TypeScript

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Lista completa de anuncios
socket.on("ads_update", ({ ads }) => renderAds(ads));

// Eventos en tiempo real
socket.on("ad_created", ({ ad }) => console.log("Nuevo:", ad));
socket.on("ad_updated", ({ ad }) => console.log("Editado:", ad));
socket.on("ad_deleted", ({ id }) => console.log("Eliminado:", id));
socket.on("ad_click", ({ id, clicks }) => console.log("Click:", id, clicks));
socket.on("notification", (n) => alert(`${n.title}: ${n.message}`));

// Registrar click
const onAdClick = (adId, url) => {
  socket.emit("ad_click", { adId });
  if (url) window.open(url, "_blank");
};
```

---

### 3. React / Next.js

```jsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function AdBanner() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    socket.on("ads_update", ({ ads }) => {
      setAds(ads.filter((a) => a.type === "banner"));
    });
    return () => socket.off("ads_update");
  }, []);

  const handleClick = (ad) => {
    socket.emit("ad_click", { adId: ad.id });
    if (ad.options?.clickable_image && ad.link_url) {
      window.open(ad.link_url, "_blank");
    }
  };

  return (
    <div className="ad-container">
      {ads.map((ad) => (
        <div key={ad.id} onClick={() => handleClick(ad)}>
          {ad.options?.show_image && ad.image_url && (
            <img src={ad.image_url} alt={ad.title} />
          )}
          <h3>{ad.title}</h3>
          {ad.options?.show_description && <p>{ad.content}</p>}
          {ad.options?.show_button && (
            <a href={ad.options.button_url}>{ad.options.button_text}</a>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### 4. Vue.js

```vue
<template>
  <div class="ads">
    <div v-for="ad in ads" :key="ad.id" @click="handleClick(ad)">
      <img v-if="ad.options?.show_image" :src="ad.image_url" />
      <h3>{{ ad.title }}</h3>
      <p v-if="ad.options?.show_description">{{ ad.content }}</p>
      <button v-if="ad.options?.show_button">
        {{ ad.options.button_text }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
const ads = ref([]);

onMounted(() => {
  socket.on("ads_update", (data) => {
    ads.value = data.ads.filter((a) => a.type === "banner");
  });
});

onUnmounted(() => socket.disconnect());

const handleClick = (ad) => {
  socket.emit("ad_click", { adId: ad.id });
};
</script>
```

---

### 5. Flutter / Dart

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class AdService {
  late IO.Socket socket;

  void connect() {
    socket = IO.io('http://localhost:3000', <String, dynamic>{
      'transports': ['websocket'],
    });

    socket.on('ads_update', (data) {
      List ads = data['ads'];
      for (var ad in ads) {
        print('Ad: ${ad['title']}');
        if (ad['options']?['show_button'] == true) {
          print('Button: ${ad['options']['button_text']}');
        }
      }
    });

    socket.on('notification', (data) {
      print('Notification: ${data['title']}');
    });
  }

  void registerClick(int adId) {
    socket.emit('ad_click', {'adId': adId});
  }
}
```

---

### 6. Android (Kotlin)

```kotlin
// Agregar dependencia: implementation 'io.socket:socket.io-client:2.1.0'

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class AdManager {
    private lateinit var socket: Socket

    fun connect() {
        socket = IO.socket("http://localhost:3000")

        socket.on("ads_update") { args ->
            val data = args[0] as JSONObject
            val ads = data.getJSONArray("ads")
            for (i in 0 until ads.length()) {
                val ad = ads.getJSONObject(i)
                println("Ad: ${ad.getString("title")}")
            }
        }

        socket.connect()
    }

    fun registerClick(adId: Int) {
        socket.emit("ad_click", JSONObject().put("adId", adId))
    }
}
```

---

### 7. iOS (Swift)

```swift
// Agregar: pod 'Socket.IO-Client-Swift'

import SocketIO

class AdManager {
    let manager = SocketManager(socketURL: URL(string: "http://localhost:3000")!)
    var socket: SocketIOClient!

    func connect() {
        socket = manager.defaultSocket

        socket.on("ads_update") { data, _ in
            if let dict = data[0] as? [String: Any],
               let ads = dict["ads"] as? [[String: Any]] {
                for ad in ads {
                    print("Ad: \(ad["title"] ?? "")")
                }
            }
        }

        socket.connect()
    }

    func registerClick(adId: Int) {
        socket.emit("ad_click", ["adId": adId])
    }
}
```

---

## ⚙️ Opciones del Anuncio

```json
{
  "options": {
    "show_image": true,
    "show_description": true,
    "show_button": true,
    "button_text": "Ver más",
    "button_url": "https://...",
    "clickable_image": true,
    "show_close_btn": true,
    "auto_close": false,
    "auto_close_time": 5,
    "animation": "fade",
    "text_align": "left",
    "title_size": "medium",
    "image_position": "top",
    "content_position": "bottom",
    "button_align": "left",
    "button_style": "filled",
    "padding": "medium"
  }
}
```

### Opciones de Visibilidad

| Opción             | Tipo    | Default   | Descripción              |
| ------------------ | ------- | --------- | ------------------------ |
| `show_image`       | boolean | true      | Mostrar imagen           |
| `show_description` | boolean | true      | Mostrar descripción      |
| `show_button`      | boolean | false     | Mostrar botón CTA        |
| `button_text`      | string  | "Ver más" | Texto del botón          |
| `button_url`       | string  | ""        | URL del botón            |
| `clickable_image`  | boolean | true      | Imagen abre URL al click |
| `show_close_btn`   | boolean | true      | Botón para cerrar        |

### Opciones de Comportamiento

| Opción            | Tipo    | Default | Descripción               |
| ----------------- | ------- | ------- | ------------------------- |
| `auto_close`      | boolean | false   | Cerrar automáticamente    |
| `auto_close_time` | number  | 5       | Segundos para auto-cerrar |
| `animation`       | string  | "fade"  | fade, slide, zoom, bounce |

### Opciones de Posicionamiento

| Opción             | Tipo   | Default  | Valores                      | Descripción                   |
| ------------------ | ------ | -------- | ---------------------------- | ----------------------------- |
| `text_align`       | string | "left"   | left, center, right          | Alineación del texto          |
| `title_size`       | string | "medium" | small, medium, large         | Tamaño del título             |
| `image_position`   | string | "top"    | top, left, right, background | Posición de la imagen         |
| `content_position` | string | "bottom" | top, center, bottom, overlay | Posición del contenido        |
| `button_align`     | string | "left"   | left, center, right          | Alineación del botón CTA      |
| `button_style`     | string | "filled" | filled, outline, text        | Estilo visual del botón       |
| `padding`          | string | "medium" | small, medium, large         | Espaciado interno del anuncio |

---

## 🔔 Push Notifications

### Enviar desde el servidor

```javascript
socket.emit("push_notification", {
  title: "Nueva oferta",
  message: "¡50% de descuento!",
  type: "promo", // info, success, warning, promo
  target: "all", // all, active
});
```

### Recibir en cliente

```javascript
socket.on("notification", (notif) => {
  showToast(notif.title, notif.message);
});
```

---

## 🧪 Testing

Abre `http://localhost:3000/test.html` para ver los anuncios en tiempo real con todas las opciones funcionando.

---

## 📄 Licencia

MIT
