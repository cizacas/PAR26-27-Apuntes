## Objetivos generales
- Conocer y aplicar estándares y medios físicos para redes cableadas e inalámbricas.
- Montar y verificar distintos tipos de cableado y conectividad.
- Aplicar direccionamiento IP (IPv4/IPv6) y mecanismos dinámicos (DHCP, SLAAC).
- Instalar y configurar adaptadores y dispositivos bajo diversos sistemas operativos.
- Representar y monitorizar topologías físicas y lógicas (herramientas y SNMP).

## Estructura de la unidad y desarrollo por apartados


## 3. Montaje de cables: directo, cruzado y de consola

*(CE-b, CE-c: montaje de cables y comprobación con instrumentos.)*

### 3.1 Herramientas y materiales

- **Herramientas:** pelacables, crimpadora para RJ45, tester de cables, cortacables, destornillador para paneles.
- **Materiales:** cable UTP/STP (la categoría elegida), conectores RJ45, manguitos y etiquetas.
- Pr

### 3.2 Procedimiento detallado (crimpado RJ45)

1. Cortar la cubierta exterior dejando ~3 cm y pelar con cuidado.
2. Separar y alisar los pares; ordenar según T568B (o T568A si se requiere).
3. Cortar los conductores de manera uniforme y empujar hasta el tope del conector RJ45.
4. Insertar el conector en la crimpadora y crimpar firmemente.
5. Probar con un comprobador de cables: continuidad, mapeo de pares y posible inversión.

### 3.3 Tipos de cable y uso

- Cable directo (straight): mismo orden en ambos extremos — PC ↔ switch.
- Cable cruzado (crossover): orden invertido en pares TX/RX — usado históricamente PC↔PC o switch↔switch.
- Cable de consola: normalmente RJ45‑to‑serial o USB‑serial para consola de equipos de red.

### 3.4 Buenas prácticas

- No exceder 100 m en enlaces UTP; evitar curvas cerradas; proteger y etiquetar vías y parches.

### 3.5 Ejemplo de checklist

- Para 10 cables: comprobar continuidad, orden de pines, resistencia de pares < X ohm, prueba funcional con equipo.

---


## 4. Comprobación de conectividad con comprobadores

*(CE-c: uso de comprobadores para verificar la conectividad de distintos tipos de cables.)*
### 4.1 Tipos de comprobadores y funciones

- Testers de bolsillo: verifican continuidad y mapeo rápido de pares.
- Certificadores profesionales (Fluke): miden NEXT, pérdida, pérdida de retorno y dan un reporte de conformidad con la categoría.
- Medidores de potencia óptica y fuentes/receivers: miden atenuación en enlaces de fibra.

### 4.2 Interpretación básica de resultados

- Continuidad OK: todos los pares conectados y en orden.
- Pares abiertos: falta de continuidad en uno o varios conductores.
- Cortocircuito: unión entre pares; falla grave.
- Inversión de pares: TX/RX cruzados (puede afectar negociaciones).
- Pérdida en fibra: expresada en dB; comparar con límites del enlace para garantizar margen.

### 4.3 Ejemplo de informe breve

- Identificador: cable_01
- Resultado: continuidad OK; resistencia media 0.8 Ω; pérdida óptica N/A.

---
### 8.4 Ejemplo práctico: comprobar y configurar en Linux adaptadores

1. Listar interfaces: `ip link show`.
2. Comprobar dirección: `ip addr show eth0`.
3. Forzar 1 Gbps full duplex (si el driver lo permite): `sudo ethtool -s eth0 speed 1000 duplex full autoneg on`.
4. Comprobar estado físico y estadísticas: `ethtool eth0` y `cat /sys/class/net/eth0/statistics/rx_packets`.

### 8.5 Buenas prácticas

- Documentar versión de driver y firmware al instalar equipos; probar con distintos cables y puertos si hay problemas.
- Para adaptadores Wi‑Fi, verificar compatibilidad con estándares (802.11ac/ax) y band steering en APs.

## 6. Integración de dispositivos en redes cableadas e inalámbricas

*(CE-f, CE-g: integración y comprobación funcional de dispositivos en redes.)*

### 9.1 Procedimiento general de integración

- Preparación: comprobar requisitos (IP, VLAN, puerto switch, cableado) y documentación del dispositivo.
- Conexión física: comprobar enlace (LED, `ethtool` / Device Manager) y etiquetado del puerto.
- Configuración inicial: asignar IP (estática o DHCP), nombre de host y parámetros de servicio (DNS, NTP).
- Pruebas funcionales: ping al gateway, resolución DNS, acceso a servicios (HTTP, SMB, impresión).

### 9.2 Integración de impresoras y periféricos

- Preferir IP estática o reserva DHCP para impresoras y servidores.
- Configurar drivers y compartir recursos; registrar nombre y IP en DNS interno.
- Verificaciones: imprimir página de prueba desde Windows/Linux/macOS y comprobar colas de impresión.

### 9.3 Seguridad inalámbrica y políticas

- Protocolos: WEP (obsoleto), WPA2 (AES) y WPA3 (mejoras en protección). Usar WPA2/WPA3 según hardware.
- Autenticación empresarial: 802.1X con servidor RADIUS para control de acceso por usuario/dispositivo.
- Segmentación: usar VLANs para separar tráfico invitado y dispositivos IoT.

### 9.4 Ejemplo práctico

- Caso: añadir una impresora de red con IP fija `192.168.20.30`, gateway `192.168.20.1` y DNS `192.168.20.10`.
	1. Conectar físicamente y comprobar enlace.
	2. Configurar IP en panel web de la impresora o por consola.
	3. Registrar en DNS y crear cola de impresión en servidor o en cada estación.
	4. Realizar prueba de impresión desde un cliente Windows y un cliente Linux.

#### Diagrama: switch y tabla MAC (visual)

```mermaid
flowchart LR
		subgraph SW[Switch]
			P1[Puerto 1]\n(MAC 00:11:22:33:44:55)
			P2[Puerto 2]\n(MAC AA:BB:CC:DD:EE:FF)
			P3[Puerto 3]\n(MAC 00:1A:2B:3C:4D:5E)
		end
		P1 -->|trama| P2
		P3 -->|trama| P1
		style SW fill:#fff7e6,stroke:#333
```


## 10. Comprobación de conectividad entre dispositivos y adaptadores inalámbricos

*(CE-g: comprobación de conectividad entre dispositivos y adaptadores inalámbricos.)*

### 10.1 Herramientas de diagnóstico y comandos

- Ping y traceroute: comprobación básica de alcance y rutas (`ping`, `traceroute`/`tracert`).
- Información de interfaz: `ip addr`, `ip link`, `ifconfig`, `ipconfig /all`.
- Wireless: `netsh wlan show interfaces` (Windows), `iw dev wlan0 link` (Linux), `nmcli` para NetworkManager.

### 10.2 Pruebas de rendimiento y métricas

- `iperf3` para ancho de banda (TCP/UDP), `ping` para latencia y pérdida, `mtr` para traza continua.
- Medir jitter y pérdida con `iperf3 -u` y herramientas específicas de VoIP si se necesita.

### 10.3 Procedimiento de prueba

1. Establecer servidor: `iperf3 -s` en el equipo servidor.
2. Ejecutar cliente: `iperf3 -c <ip_servidor>` en el equipo cliente.
3. Repetir pruebas en distintos tiempos y canales (para Wi‑Fi) y promediar resultados.

### 10.4 Ejemplo práctico

- Medir ancho de banda entre PC y servidor a través de AP:
	- En servidor: `iperf3 -s`.
	- En cliente: `iperf3 -c 192.168.20.10 -t 30` (30 segundos).
	- Registrar Mbps y comparar con tasa esperada.


## 11. Representación del mapa físico y lógico de una red

*(CE-h: uso de aplicaciones para representar el mapa físico y lógico de una red.)*

### 11.1 Qué incluir en los mapas

- Elementos físicos: racks, switches, paneles de parcheo, armarios, trazado de cables y puertos.
- Elementos lógicos: VLANs, subredes, puertas de enlace, servidores y servicios.
- Metadatos: versión de firmware, puertos usados, etiquetas de patch panel y responsables.

### 11.2 Herramientas y formatos recomendados

- draw.io (gratuito), Microsoft Visio (comercial), plantillas Markdown con tablas y mapas embebidos.
- Exportar en PNG/PDF para documentación y en XML/diagrama para edición posterior.

### 11.3 Ejemplo de tabla asociada al mapa

- Tabla: dispositivo, IP, VLAN, puerto switch, puertos físicos, responsable.

### 11.4 Buenas prácticas

- Mantener versionado del mapa (fecha y autor) y guardar copia en repositorio compartido.
- Realizar revisiones tras cambios físicos o lógicos significativos.



## 13. Cables ópticos: tipos y clasificación según velocidad/distancia

*(CE-j, CE-k: identificación y clasificación de cables ópticos según velocidad y distancia.)*

### 13.1 Tipos y características

- Multimodo (MMF, OM1–OM5): núcleos más grandes, adecuados para enlaces LAN y centros de datos con transceptores VCSEL; OM3/OM4/OM5 para 10 G/40 G/100 G en distancias medias.
- Monomodo (SMF): núcleo fino, ideal para largas distancias y enlaces troncales (DWDM, 10 G y superiores).

### 13.2 Conectores y pérdidas

- Conectores comunes: LC (pequeño, usado en data center), SC, ST; MPO/MTP para fibras múltiples.
- Atenuación: se mide en dB; hay que comparar pérdida total con presupuesto de enlace del transceptor.

### 13.3 Pruebas y herramientas

- Medidor de potencia óptica y fuente: medir potencia en Tx/Rx y calcular pérdida.
- OTDR: diagnóstico de trazado, localización de empalmes/roturas y medida de distancia a fallos.

### 13.4 Buenas prácticas

- Limpiar conectores antes de conectar, evitar dobleces por debajo del radio mínimo, etiquetar fibras y mantener documentación del trazado.

### 13.5 Ejemplo comparativo

- Enlace de 300 m a 10 G: multimodo OM3/OM4 suele ser suficiente.
- Enlace de 10 km a 10 G: se recomienda monomodo con transceptores apropiados.

## Metodología y actividades
- Metodología mixta: explicaciones teóricas cortas, laboratorios prácticos, ejercicios de diseño y resolución de problemas.
- Actividades sugeridas:
	- Laboratorios de crimpado y verificación de cables.
	- Talleres de configuración de adaptadores y servicios DHCP.
	- Prácticas de integración de dispositivos y pruebas de conectividad entre VLANs y WLANs.
	- Proyecto final: diseñar, montar (simulado o real) y documentar una red pequeña con mapa físico y lógico, direccionamiento IPv4/IPv6, monitorización SNMP y pruebas de rendimiento.

## Evaluación y criterios de comprobación
- Evaluación continua mediante observación en prácticas, informes técnicos y ejercicios de cálculo de subredes.
- Pruebas prácticas: montaje y verificación de cables, configuración y verificación de adaptadores, asignación y comprobación de direcciones IP.
- Proyecto final valorando: corrección técnica, documentación (mapas y tablas IP), resultados de monitorización y pruebas de rendimiento.

## Duración orientativa
- 25–30 horas lectivas: teoría breve (6–8 h), laboratorios y prácticas (16–20 h), evaluación y proyecto (3–4 h).

## Recursos y herramientas
- Materiales: cables, crimpadoras, comprobadores, adaptadores de red, puntos de acceso, switch manageable (si es posible), fibras de práctica o simulador.
- Software: sistemas operativos (Windows/Linux/macOS), Wireshark, iperf, herramientas SNMP (snmpwalk), draw.io, Packet Tracer o GNS3 para simulación.
