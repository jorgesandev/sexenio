import * as echarts from "echarts/core";
import { LineChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  MarkAreaComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export { echarts };
export type { EChartsType } from "echarts/core";
