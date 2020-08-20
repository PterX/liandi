import * as path from "path";
import {hasTopClosestByTag} from "../../vditore/src/ts/util/hasClosest";
import {escapeHtml} from "../util/escape";
import {destroyDialog} from "../util/dialog";
import {openFile} from "../editor/util";
import {Tab} from "../layout/Tab";
import {Model} from "../layout/Model";
import {processMessage} from "../util/processMessage";
import {getAllModels, getCenterActiveWnd} from "../layout/util";
import {Wnd} from "../layout/Wnd";
import {Constants} from "../constants";

export class Files extends Model {
    private element: HTMLElement
    public parent: Tab

    constructor(tab: Tab) {
        super({
            id: tab.id,
            callback() {
                window.liandi.config.boxes.map((item: IBox) => {
                    this.onMount({dir: item}, getAllModels());
                });
            }
        });

        this.ws.onmessage = (event) => {
            const data = processMessage(event.data);
            if (data) {
                switch (data.cmd) {
                    case "ls":
                        this.onLs(data.data);
                        break;
                    case "unmount":
                        this.onUnmount(data.data.url)
                        break;
                    case "mount":
                    case "mountremote":
                        this.onMount(data.data, getAllModels());
                        break;
                    case "remove":
                        this.onRemove(data.data.url)
                        break;
                    case "create":
                    case "mkdir":
                        this.onMkdir(data);
                        break;
                    case "rename":
                        this.onRename(data.data);
                        break;
                }
            }
        };

        this.element = tab.panelElement;
        this.element.classList.add("file");
        this.element.addEventListener("dblclick", (event) => {
            let target = event.target as HTMLElement;
            const ulElement = hasTopClosestByTag(target, "UL");
            if (ulElement) {
                const dir = JSON.parse(decodeURIComponent(ulElement.getAttribute("data-dir")));
                while (target && !target.isEqualNode(ulElement)) {
                    if (target.classList.contains("item__arrow")) {
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    if (target.getAttribute("data-type") === "navigation-file") {
                        this.setCurrent(target);
                        openFile(getCenterActiveWnd() as Wnd, dir.url, decodeURIComponent(target.getAttribute("data-path")));
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    if (target.tagName === "LI" && target.getAttribute("data-type") !== "navigation-file") {
                        this.getLeaf(target, dir);
                        this.setCurrent(target);
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    target = target.parentElement;
                }
            }
        });
        this.element.addEventListener("click", (event) => {
            let target = event.target as HTMLElement;
            const ulElement = hasTopClosestByTag(target, "UL");
            if (ulElement) {
                const dir = JSON.parse(decodeURIComponent(ulElement.getAttribute("data-dir")));
                while (target && !target.isEqualNode(ulElement)) {
                    if (target.classList.contains("item__arrow")) {
                        this.getLeaf(target.parentElement, dir);
                        this.setCurrent(target.parentElement);
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    if (target.tagName === "LI") {
                        this.setCurrent(target);
                        event.preventDefault();
                        event.stopPropagation();
                        break;
                    }
                    target = target.parentElement;
                }
            }
        });
    }

    private reloadGraphBacklinks(allModels: IModels) {
        allModels.backlinks.forEach((item) => {
            if (!item.path) {
                item.send("backlinks", {});
            }
        })
        allModels.graph.forEach((item) => {
            if (!item.path) {
                item.send("graph", {
                    k: item.inputElement.value
                });
            }
        })
    }

    private onMkdir(data: {
        cmd: string,
        callback?: string,
        data: {
            box: {
                url: string
            },
            path: string,
            files: []
        }
    }) {
        const itemData = window.liandi.menus?.itemData;
        let targetElement = itemData?.target;
        if (!this.element.contains(targetElement) && targetElement) {
            targetElement = this.element.querySelector(`ul[data-url='${encodeURIComponent(data.data.box.url)}'] li[data-path='${targetElement.getAttribute("data-path")}']`);
        }
        if (data.callback === Constants.CB_CREATE_INSERT) {
            targetElement = this.element.querySelector(`ul[data-url='${encodeURIComponent(data.data.box.url)}'] li[data-path='${encodeURIComponent(path.posix.dirname(data.data.path))}']`);
        }
        if (targetElement) {
            targetElement.firstElementChild.classList.remove("fn__hidden");
            if (targetElement.firstElementChild.classList.contains("item__arrow--open")) {
                targetElement.firstElementChild.classList.remove("item__arrow--open");
                targetElement.nextElementSibling?.remove();
            }
            targetElement.setAttribute("data-files", JSON.stringify(data.data.files));
            this.getLeaf(targetElement, data.data.box);
        }
        if (data.cmd === 'create') {
            const allModels = getAllModels();
            allModels.graph.forEach((item) => {
                if (!item.path) {
                    item.send("graph", {
                        k: item.inputElement.value
                    });
                }
            })
        }
        destroyDialog();
    }

    private onRemove(url: string) {
        const itemData = window.liandi.menus?.itemData;
        let targetElement = itemData?.target;
        if (!this.element.contains(targetElement)) {
            targetElement = this.element.querySelector(`ul[data-url='${encodeURIComponent(url)}'] li[data-path='${targetElement.getAttribute("data-path")}']`);
        }
        if (targetElement) {
            if (targetElement.nextElementSibling?.tagName === "UL") {
                targetElement.nextElementSibling.remove();
            }
            targetElement.remove();
        }
        destroyDialog();
        const allModels = getAllModels();
        allModels.editor.forEach((item) => {
            if (item.url === itemData.url && item.path.indexOf(itemData.path) === 0) {
                item.parent.parent.removeTab(item.parent.id);
            }
        })
        this.reloadGraphBacklinks(allModels)
    }

    private onUnmount(url: string) {
        const itemData = window.liandi.menus?.itemData;
        let targetElement = itemData?.target;
        if (!this.element.contains(targetElement)) {
            targetElement = this.element.querySelector(`ul[data-url='${encodeURIComponent(url)}'] li[data-path='${targetElement.getAttribute("data-path")}']`);
        }
        if (targetElement) {
            targetElement.parentElement.remove();
        }
        destroyDialog();
        const allModels = getAllModels();
        allModels.editor.forEach((item) => {
            if (item.url === itemData.url && item.path.indexOf(itemData.path) === 0) {
                item.parent.parent.removeTab(item.parent.id);
            }
        })
        this.reloadGraphBacklinks(allModels)
    }

    public getLeaf(liElement: HTMLElement, dir: IBox) {
        const files = JSON.parse(liElement.getAttribute("data-files"));
        if (liElement.firstElementChild.classList.contains("item__arrow--open")) {
            liElement.firstElementChild.classList.remove("item__arrow--open");
            liElement.nextElementSibling.remove();
            return;
        }

        liElement.firstElementChild.classList.add("item__arrow--open");

        let fileHTML = "";
        files.forEach((item: IFile) => {
            const style = ` style="padding-left: ${(item.path.split("/").length - (item.isdir ? 2 : 1)) * 13 + (item.isdir ? 0 : 18)}px"`;
            if (item.isdir) {
                fileHTML += `<li data-name="${encodeURIComponent(item.name)}" data-path="${encodeURIComponent(item.path)}" data-type="navigation-folder" class="fn__a fn__flex"${style}>
<svg class="item__arrow fn__hidden" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><use xlink:href="#iconRight"></use></svg>
<span class="item__name">
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><use xlink:href="#${dir.path === "" ? "iconCloud" : "iconFolder"}"></use></svg>
  <span class="fn__ellipsis">${escapeHtml(item.name)}</span>
</span>
</li>`;
                this.send("ls", {
                    url: dir.url,
                    path: item.path,
                }, true);
            } else {
                fileHTML += `<li${style}  data-name="${encodeURIComponent(item.name)}" data-type="navigation-file" class="item__name fn__a" data-path="${encodeURIComponent(
                    item.path)}">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><use xlink:href="#iconMD"></use></svg>
<span class="fn__ellipsis">${escapeHtml(item.name)}</span></li>`;
            }
        });
        liElement.insertAdjacentHTML("afterend",
            `<ul>${fileHTML}</ul>`);
    }

    private setCurrent(target: HTMLElement) {
        this.element.querySelectorAll("li").forEach((liItem) => {
            liItem.classList.remove("item--current");
        });
        target.classList.add("item--current");
    }

    public onRename(data: { newPath: string, oldPath: string, newName: string, url: string }) {
        const fileItemElement = this.element.querySelector(`ul[data-url="${encodeURIComponent(data.url)}"] li[data-path="${encodeURIComponent(data.oldPath)}"]`);
        fileItemElement.setAttribute("data-path", encodeURIComponent(data.newPath));
        fileItemElement.setAttribute("data-name", encodeURIComponent(data.newName));
        fileItemElement.querySelector(".fn__ellipsis").innerHTML = escapeHtml(data.newName);
        if (data.newPath.endsWith("/")) {
            const files = JSON.parse(fileItemElement.getAttribute("data-files"));
            files.forEach((item: IFile) => {
                item.path = item.path.replace(data.oldPath, data.newPath);
            });
            fileItemElement.setAttribute("data-files", JSON.stringify(files));
        }
        destroyDialog();
    }

    public onLs(data: { files: IFile[], url: string, path: string }) {
        const liElement = this.element.querySelector(`ul[data-url="${encodeURIComponent(data.url)}"] li[data-path="${encodeURIComponent(data.path)}"]`);
        if (liElement) {
            liElement.setAttribute("data-files", JSON.stringify(data.files));
            if (data.files.length > 0) {
                liElement.firstElementChild.classList.remove("fn__hidden");
            }
        }
    }

    public onMount(data: { dir: IBox, existed?: boolean }, allModels: IModels) {
        destroyDialog();
        if (data.existed) {
            return;
        }
        const html = `<ul data-url="${encodeURIComponent(data.dir.url)}" data-dir="${encodeURIComponent(JSON.stringify(data.dir))}">
<li class="fn__flex fn__a" data-type="navigation-root" data-path="%2F">
<svg class="item__arrow fn__hidden" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><use xlink:href="#iconRight"></use></svg>
<span class="item__name">
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><use xlink:href="#${data.dir.path === "" ? "iconCloud" : "iconFolder"}"></use></svg>
  <span class="fn__ellipsis">${path.posix.basename(escapeHtml(data.dir.url))}</span>
</span>
</li></ul>`;
        this.element.insertAdjacentHTML("beforeend", html);

        this.send("ls", {
            url: data.dir.url,
            path: "/",
        }, true);
        this.reloadGraphBacklinks(allModels)
    }

    public show() {
        this.element.classList.remove("fn__none");
        document.getElementById("resize").classList.remove("fn__none");
        document.getElementById("barNavigation").classList.add("item--current");
    }

    public hide() {
        this.element.classList.add("fn__none");
        document.getElementById("resize").classList.add("fn__none");
        document.getElementById("barNavigation").classList.remove("item--current");
    }
}
