import * as echarts from 'echarts';

export class Graph {
    public element: HTMLDivElement;
    private chart: echarts.ECharts

    constructor() {
        this.element = document.getElementById("graph") as HTMLDivElement
    }

    show(liandi: ILiandi) {
        this.element.classList.remove("fn__none")
        // TODO remove true
        liandi.ws.send("graph", {}, true);
    }

    hide() {
        this.element.classList.add("fn__none")
    }

    resize() {
        if (!this.element.classList.contains("fn__none")) {
            this.chart.resize();
        }
    }

    onGraph(liandi: ILiandi, data: { data: string[], links: Record<string, unknown>[] }) {
        this.chart = echarts.init(liandi.graph.element)
        this.chart.setOption({
                animationDurationUpdate: 1500,
                animationEasingUpdate: 'quinticInOut',
                series: [
                    {
                        type: 'graph',
                        layout: 'circular',
                        focusNodeAdjacency: true,
                        symbolSize: 15,
                        roam: true,
                        itemStyle: {
                            borderColor: '#fff',
                            borderWidth: 1,
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.3)'
                        },
                        label: {
                            position: 'right',
                            formatter: '{b}'
                        },
                        lineStyle: {
                            color: 'source',
                            curveness: 0.3
                        },
                        emphasis: {
                            lineStyle: {
                                width: 3
                            }
                        },
                        edgeSymbol: ['circle', 'arrow'],
                        edgeSymbolSize: [4, 10],
                        edgeLabel: {
                            fontSize: 14
                        },
                        data: data.data,
                        links: data.links,
                    }
                ]
            }
        );

        this.chart.on('click', (params: string) => {
            console.log(params);
        });
    }
}
