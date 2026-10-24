# Tabulado manual: PIB nominal trimestral

`inegi_pib_nominal_quarterly.csv` contiene el Producto Interno Bruto a precios
corrientes, por trimestre, en **millones de pesos corrientes**.

- **Fuente:** INEGI, Producto Interno Bruto Trimestral (PIBT), tabulado
  “Pesos a precios corrientes”, fila “Producto Interno Bruto, a precio de
  mercado”.
- **URL:** https://www.inegi.org.mx/temas/pib/ (pestaña “Valores corrientes”)
- **Extracción:** 2026-10-23.
- **Cobertura:** 1993/1T a 2026/2T.
- **Nota:** los valores trimestrales del tabulado están expresados en niveles
  anualizados, tal como los publica INEGI. Se usan únicamente como denominador
  para calcular `deuda_shrfsp_pib`; no se publican como una serie del sitio.

Motivo del archivo manual: el tabulado de valores corrientes se renderiza en el
navegador y no expone un CSV estable. Se congela aquí para que el ETL sea
reproducible y auditable. Si INEGI revisa la serie, actualizar este archivo con
la nueva extracción y su fecha.
