# Guía: Importar imagen .qcow2 de Zabbix en Proxmox y crear plantilla

Esta guía describe, paso a paso, cómo importar una imagen KVM/QEMU (.qcow2) de Zabbix en Proxmox, dejarla lista y convertirla en plantilla para clonar instancias para prácticas de laboratorio.

Sustituir los valores en MAYÚSCULAS por los de tu entorno (VMID, NOMBRE_DE_ALMACENAMIENTO, RUTA_LOCAL, BRIDGE, NOMBRES, etc.).

---

## Resumen del flujo

1. Descargar la imagen .qcow2 desde la web de Zabbix.
2. Subir el .qcow2 al host Proxmox (por SCP o mediante la interfaz web).
3. Crear una VM "placeholder" en Proxmox (sin disco grande).
4. Importar el .qcow2 al almacenamiento con `qm importdisk`.
5. Adjuntar el disco importado a la VM (virtio o scsi) y configurar arranque.
6. Arrancar la VM y realizar comprobaciones/ajustes en el guest.
7. Apagar la VM, convertirla en plantilla y clonar las instancias necesarias.

---

## Requisitos previos

- Acceso SSH al host Proxmox o a la interfaz web de Proxmox.
- Espacio en el almacenamiento elegido (local-lvm, zfs, etc.).
- Archivo .qcow2 de Zabbix descargado (p. ej. `zabbix-7.4.qcow2`).
- VMID libre para crear la VM (ej. `9000`).
- Bridge de red en Proxmox (ej. `vmbr0`).

---

## A. Descargar y subir la imagen (.qcow2)

Opción 1 — desde tu estación (ejemplo con scp):

```bash
# Descargar desde la web de Zabbix a tu equipo local (navegador o wget/curl)
# Subir al host Proxmox (reemplaza PROXMOX_HOST y RUTA_LOCAL si procede)
scp zabbix-7.4.qcow2 root@PROXMOX_HOST:/root/
```

Opción 2 — usar la interfaz web de Proxmox (Datacenter → Storage → Upload) para subir el .qcow2 directamente al almacenamiento.

---

## B. Crear VM "placeholder" en Proxmox

Elegir un VMID libre, por ejemplo `9000`.

```bash
# Crear VM sin disco grande (solo metadata)
qm create 9000 \
  --name zabbix-base \
  --memory 4096 \
  --cores 2 \
  --net0 virtio,bridge=vmbr0 \
  --ostype l26
```

Ajusta memoria/CPU según lo necesario.

---

## C. Importar el .qcow2 al almacenamiento con `qm importdisk`

Ejecutar en el host Proxmox:

```bash
# IMPORTAR disco. Reemplaza /root/zabbix-7.4.qcow2 y STORAGE por los tuyos (ej: local-lvm)
qm importdisk 9000 /root/zabbix-7.4.qcow2 STORAGE
```

Notas:
- `qm importdisk` convertirá y colocará el disco en el almacenamiento elegido y lo registrará como un disco asociado a la VMID, pero no lo adjuntará automáticamente.

---

## D. Adjuntar el disco importado como disco de la VM

Tras importar, el fichero de disco suele quedar con nombre tipo `vm-9000-disk-0` en el almacenamiento. Adjuntar como SCSI (virtio-scsi-pci) o virtio:

```bash
# Usando virtio-scsi-pci + scsi0
qm set 9000 --scsihw virtio-scsi-pci --scsi0 STORAGE:vm-9000-disk-0
# O usar virtio0 directo
# qm set 9000 --virtio0 STORAGE:vm-9000-disk-0

# Establecer orden de arranque al disco
qm set 9000 --boot order=scsi0
```

Sustituye `STORAGE` por `local`, `local-lvm`, `zfs-datastore`, etc., según tu configuración.

---

## E. Arrancar la VM y comprobar

```bash
qm start 9000
# Conectar por consola desde la interfaz web o
qm terminal 9000
```

Dentro del guest:
- Comprobar red (ip a / ip addr / ifconfig), credenciales por defecto de la imagen (consulta la documentación de la imagen oficial de Zabbix si existe).
- Comprobar servicio Zabbix (si la imagen lo trae preinstalado): `systemctl status zabbix-server` o revisar la documentación de la imagen.

Recomendaciones:
- Cambiar contraseñas por defecto.
- Asignar hostname adecuado.
- Ajustar IP estática o DHCP según el laboratorio.

---

## F. Preparar la VM para clonación (limpieza y agentes)

Antes de convertir en plantilla, limpiar identificadores y preparar guest:

Dentro del guest (Linux):

```bash
# Instalar qemu-guest-agent para mejor integración con Proxmox
sudo apt update && sudo apt install -y qemu-guest-agent
sudo systemctl enable --now qemu-guest-agent

# (Opcional) Eliminar host keys SSH para que no se repitan en clones
sudo rm -f /etc/ssh/ssh_host_*
# El sistema regenerará claves en el primer arranque o ejecutar:
# sudo dpkg-reconfigure openssh-server

# Limpiar logs y history
sudo truncate -s 0 /var/log/*.log || true
history -c || true

# (Opcional) usar cloud-init o virt-sysprep para preparar la imagen (si procede)
```

---

## G. Apagar y convertir VM en plantilla

```bash
qm shutdown 9000
# Esperar a que se apague, o forzar
# qm stop 9000

# Convertir a plantilla
qm template 9000
```

---

## H. Clonar plantilla

Clonar la plantilla a nuevas VMIDs para los alumnos:

```bash
# Clonado completo (usa más espacio pero independiente)
qm clone 9000 9010 --name zabbix-alumno-01 --full true
qm clone 9000 9011 --name zabbix-alumno-02 --full true

# Si tu almacenamiento y Proxmox lo permiten, puedes usar clones vinculados (linked clones):
# qm clone 9000 9010 --name zabbix-alumno-01 --full false
```

Tras clonar:
- Arrancar cada VM clonada y revisar hostname, red y credenciales.
- Regenerar claves SSH si no se limpiaron anteriormente.

---

## I. Redimensionado de disco (si es necesario)

Para aumentar el disco desde Proxmox:

```bash
qm resize 9000 scsi0 +10G
```

Luego, dentro del guest, extender la partición y el sistema de ficheros (ejemplo para ext4):

```bash
# dentro del guest, identificar la partición (lsblk)
# ajustar partición con growpart (cloud-utils) o parted, luego:
sudo resize2fs /dev/VM_DISK_PARTITION
```

---

## J. Notas y consideraciones

- Las imágenes `.qcow2` proporcionadas por Zabbix pueden traer el sistema y Zabbix preinstalados; comprobar la documentación de la imagen para credenciales y servicios incluidos.
- Para prácticas esenciales, una única VM por alumno con Zabbix Server + DB en local está bien. Para escenarios de alta disponibilidad o replicación, hay que diseñar la replicación/cluster de la base de datos (Postgres/MySQL) y considerar Zabbix Proxy.
- Si prefieres instalar desde cero (control total), utiliza la imagen ISO y sigue el instalador dentro de la VM.

---

## Comandos de ejemplo (resumen rápido)

```bash
# En host local: subir al proxmox
scp zabbix-7.4.qcow2 root@PROXMOX_HOST:/root/

# En Proxmox host:
qm create 9000 --name zabbix-base --memory 4096 --cores 2 --net0 virtio,bridge=vmbr0 --ostype l26
qm importdisk 9000 /root/zabbix-7.4.qcow2 local-lvm
qm set 9000 --scsihw virtio-scsi-pci --scsi0 local-lvm:vm-9000-disk-0
qm set 9000 --boot order=scsi0
qm start 9000

# Preparar guest (ejemplo):
# sudo apt update && sudo apt install -y qemu-guest-agent

# Convertir a plantilla y clonar:
qm shutdown 9000
qm template 9000
qm clone 9000 9010 --name zabbix-alumno-01 --full true
```

---

## K. Resumen: conexiones inalámbricas (Wi‑Fi) — explicación y recomendaciones

Esta sección resume los conceptos y parámetros prácticos que conviene conocer al configurar y evaluar adaptadores inalámbricos en prácticas de laboratorio.

1. Conceptos básicos
- SSID: nombre visible de la red Wi‑Fi. Seleccionar el SSID correcto para conectarse. 
- Autenticación y seguridad: tipos habituales:
  - WEP (obsoleto) — no usar en entornos reales.
  - WPA2‑PSK (AES) — todavía muy extendido.
  - WPA3 — más seguro, preferible si el hardware lo soporta.
  - 802.1X (WPA2/WPA3 Enterprise) — autenticación por usuario/contraseña o certificados (RADIUS).
- Canal y banda: 2.4 GHz (mayor cobertura, más congestión) vs 5 GHz / 6 GHz (menos congestión, mayor capacidad, menor cobertura).

2. Parámetros del adaptador (qué comprobar)
- SSID y clave/credenciales: imprescindibles para conectar. En redes empresariales puede requerirse certificado o usuario.
- Modo (b/g/n/ac/ax): compatibilidad entre adaptador y punto de acceso. Preferir modos más modernos si la infraestructura los soporta.
- Potencia/antena: algunos adaptadores permiten ajustar la potencia o uso de antenas externas; en prácticas, comprobar recepciones y RSSI.
- Banda y canal: comprobar interferencias y elegir canales menos congestionados (herramientas: `iwlist`, `nmcli`, aplicaciones de análisis de Wi‑Fi).
- Seguridad: verificar el tipo de cifrado; evitar WEP y TKIP cuando sea posible.

3. Configuración IP
- Normalmente la IP se obtiene por DHCP. Para prácticas de laboratorio o servidores puede ser necesario usar IP estática.
- DNS y puerta de enlace: necesarios para acceso a Internet y resolución de nombres.

4. Autenticación avanzada y certificados
- 802.1X: para redes de empresa/centros educativos; requiere servidor RADIUS y certificados o credenciales de usuario.
- EAP-TLS: autenticación por certificados (más segura que EAP‑PEAP/MSCHAPv2).

5. Pruebas prácticas y comprobaciones
- Ping y traceroute para verificar conectividad.
- `iwconfig`, `iw dev`, `iwlist scan`, `nmcli` (Linux) para comprobar estado, modo y SSID.
- Medir RSSI/Signal-to-Noise (SNR) para evaluar calidad de enlace.
- Probar roaming (si hay varios APs) y band steering si procede.

6. Buenas prácticas para el laboratorio
- Documentar SSID, tipo de seguridad y credenciales en el material de prácticas.
- Usar redes separadas (VLANs o SSIDs) para alumnos y administración.
- Preparar un AP de pruebas con WPA2/WPA3-PSK y, si se enseña 802.1X, un RADIUS en una VM separada.
- Registrar qué adaptadores del alumnado soportan 802.11ac/ax para ajustar expectativas.

---

## L. Ejemplo: montar un RADIUS de prueba (FreeRADIUS) en una VM

Este ejemplo muestra pasos mínimos para desplegar un servidor RADIUS de pruebas usando FreeRADIUS en una VM (Ubuntu Server). Está pensado para prácticas del laboratorio y no como una configuración de producción.

Resumen rápido:
- Crear una VM (Ubuntu Server) en Proxmox.
- Instalar FreeRADIUS y utilidades.
- Configurar un cliente RADIUS (por ejemplo un AP) con una shared secret y añadirlo en `clients.conf`.
- Añadir un usuario de prueba en `mods-config/files/authorize` o en `users`.
- Probar con `radtest` o `radclient` desde la VM o desde otra máquina.

Pasos detallados (Ubuntu 22.04 / 24.04 o similar)

1) Crear la VM y acceder por consola/SSH
- Crear VM en Proxmox (p. ej. 2 vCPU, 2–4 GB RAM, 20 GB disco) e instalar Ubuntu Server.
- Asegúrate de que la VM tiene conectividad y acceso SSH.

2) Instalar FreeRADIUS

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar freeradius y utilidades
sudo apt install -y freeradius freeradius-utils

# Comprobar versión y estado
freeradius -v
sudo systemctl status freeradius
```

3) Configurar un cliente RADIUS (punto de acceso)
- Editar `/etc/freeradius/3.0/clients.conf` o la ruta equivalente según la versión.

Añadir al final (ejemplo):

```
client laboratorio-ap {
    ipaddr = 192.168.1.250
    secret = prueba_shared_secret
    require_message_authenticator = no
}
```

- `ipaddr` puede ser la IP del AP o `0.0.0.0/0` para pruebas (no recomendado en producción).
- `secret` debe coincidir con la configuración en el AP.

4) Añadir un usuario de prueba
- Para pruebas sencillas, editar el fichero `mods-config/files/authorize` o el fichero `users` según la estructura de tu instalación.

Ejemplo en `/etc/freeradius/3.0/mods-config/files/authorize` (sintaxis simple):

```
# usuario : contraseña
alumno1 Cleartext-Password := "alumno1pass"
```

O editar `/etc/freeradius/3.0/users` y añadir:

```
alumno1    Cleartext-Password := "alumno1pass"
```

5) Reiniciar FreeRADIUS

```bash
sudo systemctl restart freeradius
sudo systemctl status freeradius
```

6) Probar la autenticación con radtest (desde la misma VM o desde otra máquina)

```bash
# Sintaxis: radtest USER PASSWORD RADIUS_SERVER PORT SECRET
radtest alumno1 alumno1pass 127.0.0.1 0 prueba_shared_secret
```

- `127.0.0.1 0` usa el puerto por defecto y localhost; si pruebas desde otra máquina, usa la IP del servidor RADIUS y reemplaza el puerto si procede.
- Salida esperada: Access-Accept (éxito) o Access-Reject (fallo). Si hay errores, revisar /var/log/freeradius/radius.log o journalctl.

7) Probar desde un AP o desde wpa_supplicant (cliente Wi‑Fi)
- Configurar en el AP el servidor RADIUS (IP y shared secret) y el método 802.1X.
- Para pruebas con `wpa_supplicant` en un cliente Linux (PEAP/MSCHAPv2):

Archivo `/etc/wpa_supplicant/wpa_supplicant.conf` mínimo:

```
network={
  ssid="SSID_de_prueba"
  key_mgmt=WPA-EAP
  eap=PEAP
  identity="alumno1"
  password="alumno1pass"
  phase2="auth=MSCHAPV2"
}
```

Arrancar:

```bash
sudo wpa_supplicant -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf -D nl80211
sudo dhclient wlan0
```

8) Logs y depuración
- Ver logs en `/var/log/freeradius/radius.log` o usar `journalctl -u freeradius -f`.
- Aumentar el nivel de depuración ejecutando FreeRADIUS en primer plano:

```bash
sudo systemctl stop freeradius
sudo freeradius -X
```

Esto muestra el flujo de EAP/RADIUS en la consola y ayuda a depurar problemas.

9) Consideraciones adicionales para prácticas
- Para un laboratorio, crear varios usuarios y, si se desea, atributos que asignen VLANs diferentes según el usuario.
- No usar secretos o contraseñas débiles en entornos productivos.
- Si se enseña EAP‑TLS, preparar una CA simple (openssl) y emitir certificados para el servidor y clientes.
- Para alta disponibilidad o replicación real, usar FreeRADIUS con backend LDAP/AD o con réplicas de base de datos.

10) Recursos y lectura
- FreeRADIUS documentation: https://wiki.freeradius.org/
- Guía rápida de 802.1X y RADIUS: https://wiki.freeradius.org/guide

---

### Comandos de ejemplo (Linux) — crear/consultar conexiones y pruebas

1) Ver interfaces y capacidades:

```bash
# Mostrar interfaces inalámbricas y capacidades
iw dev
# Mostrar drivers y capacidades (listado)
iw list
```

2) Escanear redes disponibles:

```bash
sudo iw dev wlan0 scan | less
# o con NetworkManager
nmcli device wifi list
```

3) Conectarse a una red WPA‑PSK (ejemplo usando nmcli):

```bash
nmcli device wifi connect "SSID_de_prueba" password "clave_de_prueba"
```

4) Conectarse a una red 802.1X (PEAP/MSCHAPv2) con wpa_supplicant (archivo mínimo):

```bash
cat > /etc/wpa_supplicant/wpa_supplicant.conf <<'EOF'
network={
  ssid="SSID_de_prueba"
  key_mgmt=WPA-EAP
  eap=PEAP
  identity="alumno1"
  password="alumno1pass"
  phase2="auth=MSCHAPV2"
}
EOF
sudo wpa_supplicant -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf -D nl80211 &
sudo dhclient wlan0
```

5) Crear un AP sencillo con hostapd (modo infraestructura) — ejemplo mínimo:

```bash
# /etc/hostapd/hostapd.conf
interface=wlan0
ssid=AP_prueba
channel=6
hw_mode=g
wpa=2
wpa_passphrase=prueba1234

# Iniciar hostapd
sudo hostapd /etc/hostapd/hostapd.conf
```

6) Herramientas de diagnóstico:

```bash
# Comprobar señal y enlace
iw dev wlan0 link
# Traceroute/ping para comprobar conectividad
ping -c 4 8.8.8.8
traceroute 8.8.8.8
```

---
