# Fixtures

`observations.sample.csv` es **sintético**. Se genera con:

```bash
python3 etl/make_fixtures.py
```

- Todos los valores llevan `status=fixture` y la nota `DATO SINTÉTICO — solo desarrollo`.
- Sirven para construir y probar la UI antes de conectar INEGI, Banxico, SHCP, etc.
- No se usan en producción ni se presentan como cifras reales.
- El generador es determinista: el mismo archivo produce los mismos valores.

Cuando exista el ETL real, los fixtures se conservan solo como respaldo para desarrollo y tests.
