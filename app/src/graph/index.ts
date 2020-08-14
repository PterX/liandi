import * as echarts from 'echarts';
import * as path from 'path';
import {i18n} from "../i18n";

export class Graph {
    private inputElement: HTMLInputElement;
    private element = document.getElementById("graph").lastElementChild as HTMLDivElement;
    private chart: echarts.ECharts

    constructor(liandi: ILiandi) {
        this.inputElement = this.element.previousElementSibling.firstElementChild as HTMLInputElement
        this.inputElement.placeholder = i18n[liandi.config.lang].search
        this.inputElement.addEventListener('compositionend', () => {
            this.render(liandi)
        });
        this.inputElement.addEventListener('input', (event: InputEvent) => {
            if (event.isComposing) {
                return;
            }
            this.render(liandi)
        });
    }

    render(liandi: ILiandi) {
        if (this.element.parentElement.style.display === "flex") {
            liandi.ws.send("graph", {
                k: this.inputElement.value
            });
        }
    }

    show(liandi: ILiandi) {
        this.element.parentElement.style.display = "flex";
        liandi.ws.send("graph", {
            k: this.inputElement.value
        });
        document.getElementById('resize3').classList.remove('fn__none');
        document.getElementById('barGraph').classList.add("item--current");
        liandi.backlinks.hide(liandi);
    }

    hide() {
        this.element.parentElement.style.display = "none";
        document.getElementById('resize3').classList.add('fn__none');
        document.getElementById('barGraph').classList.remove("item--current");
    }

    resize() {
        if (this.chart && this.element.parentElement.style.display === "flex") {
            this.chart.resize();
        }
    }

    onGraph(liandi: ILiandi, data: { nodes: Record<string, unknown>[], links: Record<string, unknown>[] }) {
        if (!this.chart) {
            this.chart = echarts.init(this.element)
        } else {
            this.resize()
        }
        this.chart.setOption({
                animationDurationUpdate: 1500,
                animationEasingUpdate: 'quinticInOut',
                legend: {
                    data: [{
                        name: i18n[liandi.config.lang].rootBlock,
                        icon: "circle"
                    }, {
                        name: i18n[liandi.config.lang].normalBlock,
                        icon: "circle"
                    }, {
                        name: i18n[liandi.config.lang].relativeBlock,
                        icon: "circle"
                    }],
                    top: 20,
                    right: 20,
                    orient: 'vertical',
                    textStyle: {
                        color: '#161719',
                    },
                    inactiveColor: '#7c828b',
                },
                tooltip: {
                    formatter: (params: IEchartsFormatter) => {
                        if (params.dataType === "edge") {
                            return `<div style="font-size: 12px">${params.data.lineStyle.type === "dotted" ? i18n[liandi.config.lang].relativeRelation : i18n[liandi.config.lang].parentRelation}</div>`
                        } else {
                            return `<div style="font-size: 12px">${params.data.content}</div>
<div style="font-size: 12px;color: #ccc">${params.data.name}</div>`
                        }
                    },
                },
                series: [
                    {
                        categories: [{
                            name: i18n[liandi.config.lang].rootBlock,
                            itemStyle: {
                                color: "#161719"
                            },
                        }, {
                            name: i18n[liandi.config.lang].normalBlock,
                            itemStyle: {
                                color: "#7c828b"
                            },
                        }, {
                            name: i18n[liandi.config.lang].relativeBlock,
                            itemStyle: {
                                color: "#d23f31"
                            },
                        }],
                        draggable: true,
                        label: {
                            position: 'right',
                            color: 'auto',
                            shadowColor: 'red',
                            shadowBlur: 2,
                            formatter: (params: IEchartsFormatter) => {
                                if (params.data.category === 0) {
                                    return path.posix.basename(params.data.path);
                                }
                            },
                        },
                        symbolSize: (value: number, params: IEchartsFormatter) => {
                            if (params.data.category === 0) {
                                return 18
                            } else {
                                return 12
                            }
                        },
                        force: {
                            repulsion: 100,
                            edgeLength: [30, 100],
                            // @ts-ignores
                            friction: 0.15
                        },
                        type: 'graph',
                        layout: 'force',
                        focusNodeAdjacency: true,
                        roam: true,
                        itemStyle: {
                            borderColor: 'rgba(255, 255, 255, 0.68)',
                            borderWidth: 1,
                        },
                        lineStyle: {
                            color: 'source',
                            curveness: 0,
                            opacity: 0.36,
                        },
                        emphasis: {
                            lineStyle: {
                                width: 3
                            },
                            itemStyle: {
                                borderColor: '#fff',
                            },
                        },
                        edgeSymbol: ['none', 'arrow'],
                        edgeSymbolSize: [0, 8],
                        data: data.nodes,
                        links: data.links,
                    }
                ]
            }
        );

        this.chart.on('click', (params: IEchartsFormatter) => {
            if (params.dataType === "node" && params.data.label.show) {
                liandi.editors.open(liandi, params.data.url, params.data.path)
            }
        });
    }
}
