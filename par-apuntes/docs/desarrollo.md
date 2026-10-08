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
