import {Layout} from "./index";
import {Wnd} from "./wnd";
import {i18n} from "../i18n";
import {mountFile, mountWebDAV} from "../util/mount";
import {Tab} from "./Tab";
import {Model} from "./Model";
import {Graph} from "../graph";
import {Editor} from "../editor";
import {Backlinks} from "../backlinks";
import {Files} from "../files";

export const copyTab = (tab:Tab) => {
    let model:Model
    let panel = ''
    if (tab.model instanceof Editor) {
        model = new Editor({
            tab,
            url: tab.model.url,
            path: tab.model.path
        })
    } else if (tab.model instanceof Backlinks) {
        model = new Backlinks({
            tab,
            url: tab.model.url,
            path: tab.model.path
        })
    } else if (tab.model instanceof Graph) {
        panel = '<div class="graph__input"><input class="input"></div><div class="fn__flex-1"></div>',
        model = new Graph({
            tab,
            url: tab.model.url,
            path: tab.model.path
        })
    } else if (tab.model instanceof File) {
        model = new Files(tab);
    }
    return new Tab({
        title: tab.headElement.innerHTML,
        panel,
        callback(tab: Tab) {
            tab.addModel(model);
        }
    });
}

export const getTabById = (id: string) => {
    const _getTabById = (item: Layout, id: string) => {
        if (item.id === id) {
            return item
        }
        if (!item.children) {
            return
        }
        let ret: Tab
        for (let i = 0; i < item.children.length; i++) {
            ret = _getTabById(item.children[i] as Layout, id) as Tab
            if (ret) {
                return ret
            }
        }
    }
    return _getTabById(window.liandi.layout, id)
}

export const addResize = (obj: Layout | Wnd) => {
    if (obj.resize) {
        const resizeElement = document.createElement("div");
        if (obj.resize === "lr") {
            resizeElement.classList.add("layout__resize--lr");
        }
        resizeElement.classList.add("layout__resize");
        obj.element.insertAdjacentElement("beforebegin", resizeElement);
        resizeWnd(resizeElement, obj.resize);
    }
};

export const addCenterWnd = () => {
    const wnd = new Wnd();
    wnd.addTab(new Tab({
        panel: `<div class="layout__empty">
                    <div class="item fn__flex-inline">${i18n[window.liandi.config.lang].search}/${i18n[window.liandi.config.lang].config} &lt;Double Shift></div>
                    <div class="item fn__a fn__pointer" id="editorEmptyMount">${i18n[window.liandi.config.lang].mount}</div>
                    <div class="item fn__a fn__pointer" id="editorEmptyMountDAV">${i18n[window.liandi.config.lang].mountWebDAV}</div>
                </div>`,
        callback(tab: Tab) {
            tab.panelElement.querySelector("#editorEmptyMount").addEventListener("click", () => {
                mountFile();
            });
            tab.panelElement.querySelector("#editorEmptyMountDAV").addEventListener("click", () => {
                mountWebDAV();
            });
        }
    }));
    window.liandi.centerLayout.addWnd(wnd);
};

const setSize = (item: HTMLElement, direction: string) => {
    if (item.classList.contains("fn__flex-1")) {
        if (direction === "lr") {
            item.style.width = item.clientWidth + "px";
        } else {
            item.style.height = item.clientHeight + "px";
        }
        item.classList.remove("fn__flex-1");
    }
};

const resizeWnd = (resizeElement: HTMLElement, direction: string) => {
    resizeElement.addEventListener("mousedown", (event: MouseEvent) => {
        const documentSelf = document;
        const nextElement = resizeElement.nextElementSibling as HTMLElement;
        const previousElement = resizeElement.previousElementSibling as HTMLElement;
        setSize(nextElement, direction);
        setSize(previousElement, direction);
        const x = event[direction === "lr" ? "clientX" : "clientY"];
        const previousSize = direction === "lr" ? previousElement.clientWidth : previousElement.clientHeight;
        const nextSize = direction === "lr" ? nextElement.clientWidth : nextElement.clientHeight;
        document.body.style.userSelect = "none";

        documentSelf.ondragstart = () => false;

        documentSelf.onmousemove = (moveEvent: MouseEvent) => {
            const previousNowSize = (previousSize + (moveEvent[direction === "lr" ? "clientX" : "clientY"] - x));
            const nextNowSize = (nextSize - (moveEvent[direction === "lr" ? "clientX" : "clientY"] - x));
            if (previousNowSize < 6 || nextNowSize < 6) {
                return;
            }
            previousElement.style[direction === "lr" ? "width" : "height"] = previousNowSize + "px";
            nextElement.style[direction === "lr" ? "width" : "height"] = nextNowSize + "px";
        };

        documentSelf.onmouseup = () => {
            document.body.style.userSelect = "auto";
            documentSelf.onmousemove = null;
            documentSelf.onmouseup = null;
            documentSelf.ondragstart = null;
            documentSelf.onselectstart = null;
            documentSelf.onselect = null;

            if (!nextElement.nextElementSibling) {
                nextElement.style[direction === "lr" ? "width" : "height"] = "auto";
                nextElement.classList.add("fn__flex-1");
            }
            window.liandi.rightLayoutWidth = window.liandi.rightLayout.element.clientWidth;
            window.liandi.bottomLayoutHeight = window.liandi.bottomLayout.element.clientHeight;
            // window.dispatchEvent(new CustomEvent("resize"));
        };
    });
};
