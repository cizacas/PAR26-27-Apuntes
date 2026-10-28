# Guía: Importar imagen .qcow2 de Zabbix en Proxmox y crear plantilla

Esta guía describe, paso a paso, cómo importar una imagen KVM/QEMU (.qcow2) de Zabbix en Proxmox, dejarla lista y convertirla en plantilla para clonar instancias para prácticas de laboratorio.

Sustituir los valores en MAYÚSCULAS por los de tu entorno (VMID, NOMBRE_DE_ALMACENAMIENTO, RUTA_LOCAL, BRIDGE, NOMBRES, etc.).

## Resumen del flujo

1. Descargar la imagen .qcow2 desde la web de Zabbix.
2. Subir el .qcow2 al host Proxmox (por SCP o mediante la interfaz web).
3. Crear una VM "placeholder" en Proxmox (sin disco grande).
4. Importar el .qcow2 al almacenamiento con `qm importdisk`.
5. Adjuntar el disco importado a la VM (virtio o scsi) y configurar arranque.
6. Arrancar la VM y realizar comprobaciones/ajustes en el guest.
7. Apagar la VM, convertirla en plantilla y clonar las instancias necesarias.

## Requisitos previos

- Acceso SSH al host Proxmox o a la interfaz web de Proxmox.
- Espacio en el almacenamiento elegido (local-lvm, zfs, etc.).
- Archivo .qcow2 de Zabbix descargado (p. ej. `zabbix-7.4.qcow2`).
- VMID libre para crear la VM (ej. `9000`).
- Bridge de red en Proxmox (ej. `vmbr0`).


## A. Descargar y subir la imagen (.qcow2)

Opción 1 — desde tu estación (ejemplo con scp):

```bash
# Descargar desde la web de Zabbix a tu equipo local (navegador o wget/curl)
# Subir al host Proxmox (reemplaza PROXMOX_HOST y RUTA_LOCAL si procede)
scp zabbix-7.4.qcow2 root@PROXMOX_HOST:/root/
```

Opción 2 — usar la interfaz web de Proxmox (Datacenter → Storage → Upload) para subir el .qcow2 directamente al almacenamiento.

En andromeda desplegar el icono de la izquierda, aparece en la parte inferior local(andromeda), al pinchar aparecen las opciones en la parte izquierda, en este caso `Import` y subir la .qcow2`` 
---

## B. Crear VM "placeholder" en Proxmox

Opción 1. Elegir un VMID libre, por ejemplo `9000`.

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

Opción 2. Crear la VM desde las opciones de proxmox, Create VM
   No poner sistema operativo, ni disco, en os type  linux 7.x - 2.6 kernel
   Desde la opcion hardware de la máquina virtual, seleccionar la opcion add-agregar y la opcion import hard Disk, poner import storage:`local`, select image:`.qcow2` y el target storage: `local-lvm`,  en el orden de arranque mirar que el disco cargado sea el primero,  y también cambiar que  iniciar arranque `start boot` a yes
   Arrancar la máquina  y desde consola  login: root password zabbix ,  comprobamos la ip  - ip addr show  y pongo esa ip en el navegador http://  y desde web el login Admin y zabbix
Si utilizamos esta opcion no tenemos que realizar el paso C y D y pasamos al E
   
## C. Importar el .qcow2 al almacenamiento con `qm importdisk`

Ejecutar en el host Proxmox:

```bash
# IMPORTAR disco. Reemplaza /root/zabbix-7.4.qcow2 y STORAGE por los tuyos (ej: local-lvm)
qm importdisk 9000 /root/zabbix-7.4.qcow2 STORAGE
```

Notas:
- `qm importdisk` convertirá y colocará el disco en el almacenamiento elegido y lo registrará como un disco asociado a la VMID, pero no lo adjuntará automáticamente.


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


## F. Preparar la VM para clonación (limpieza y agentes)

Para cambiar las configuraciones del teclado temporalmente `loadkeys es`
de forma permante 
En Rocky Linux (familia RHEL) se usa localectl, que cambia el teclado de forma permanente y lo aplica al momento.
`localectl set-keymap es`
Comprobarlo con
`localectl status`

Antes de convertir en plantilla, limpiar identificadores y preparar guest:

Dentro del guest (Linux):

Al ser Rocky las sentencias cambian a 

```bash
# Instalar qemu-guest-agent para mejor integración con Proxmox
dnf install -y qemu-guest-agent
systemctl enable --now qemu-guest-agent
# (Opcional) Eliminar host keys SSH para que no se repitan en clones
sudo rm -f /etc/ssh/ssh_host_*
# para regenerarlas 
ssh-keygen -A
#  comprobar el servicio correcto
ls /dev/virtio-ports/
systemctl start qemu-guest-agent
systemctl status qemu-guest-agent

# Limpiar logs y history
sudo truncate -s 0 /var/log/*.log || true
history -c || true

``` 
Me falla el agente está instalado, pero la VM no tiene el dispositivo virtio-serial que necesita (/dev/virtio-ports/org.qemu.guest_agent.0). Eso se activa desde Proxmox, no desde dentro de la VM.
En la interfaz web: VM → Options → QEMU Guest Agent → Edit → marca Use QEMU Guest Agent.

desde el shell del host Proxmox (sustituye VMID por el de tu VM):
```bash
qm set VMID --agent enabled=1
```


Lo que figura a continuación no se realiza por ser Rocky es lo realizado en el paso anterior

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

## G. Apagar y convertir VM en plantilla

```bash
qm shutdown 9000
# Esperar a que se apague, o forzar
# qm stop 9000

# Convertir a plantilla
qm template 9000
```

## H. Clonar plantilla

Tengo realizada una plantilla para clonar en  `/root/scripts` denominada `clonar_vms.sh` modicarla para este caso.

```bash
#!/bin/bash

# id de la plantilla
TEMPLATE_ID=130
START_ID=201
TOTAL_ALUMNOS=30

for i in $(seq 1 $TOTAL_ALUMNOS);do
        VM_ID=$((START_ID +i -1))
        VM_NAME=$(printf "zabbix-alumno-%02d" $i)
        echo "clonando $VM_NAME con ID $VM_ID..."
        # clon enlazado (--full 0) o clon completo (--full 1)
        qm clone $TEMPLATE_ID $VM_ID --name $VM_NAME --full 0
        # Iniciar la maquina
        qm start $VM_ID
done 
```
El script ya tiene los permisos de ejecución

```bash
chmod +x  clonar_vms.sh

```
Ejecutar la plantilla creada

```bash
./ clonar_vms.sh

```
Otro scripts para que me muestre las ip que ha creado para cada máquina `sacar_ip_mquinas.sh`

```bash
#!/bin/bash
for vmid in $(qm list | awk 'NR>1 {print $1}');do
        name=$(qm config $vmid | awk '/^name:/{print $2}')
        ip=$(qm agent $vmid network-get-interfaces 2> /dev/null | grep -oP '"ip-address"\s*:\s*"\K[0-9.]+' | grep -v '>
        printf "%-8s %-18s %-16s\n" "$vmid" "$name" "${ip:-Sin IP}"
done
```
y lo lanzo para que me cree un fichero ips's. txt

```bash
./sacar_ip_maquinas.sh >ips.txt

```


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

