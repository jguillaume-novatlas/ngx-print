import { Directive, HostListener, Input } from '@angular/core';
@Directive({
  selector: "button[NgxPrintJg]"
})
export class NgxPrintJgDirective {

  public _printStyle = [];

  /**
   *
   *
   * @memberof NgxPrintJgDirective
   */
  @Input() printSectionId: string;

  /**
   *
   *
   * @memberof NgxPrintJgDirective
   */
  @Input() printTitle: string;

  /**
   *
   *
   * @memberof NgxPrintJgDirective
   */
  @Input() useExistingCss = false;

  /**
   * A delay in milliseconds to force the print dialog to wait before opened. Default: 0
   *
   * @memberof NgxPrintJgDirective
   */
  @Input() printDelay: number = 0;

  /**
   *
   *
   * @memberof NgxPrintJgDirective
   */
  @Input()
  set printStyle(values: { [key: string]: { [key: string]: string } }) {
    for (let key in values) {
      if (values.hasOwnProperty(key)) {
      this._printStyle.push((key + JSON.stringify(values[key])).replace(/['"]+/g, ''));
      }
    }
    this.returnStyleValues();
  }

/**
 *
 *
 * @returns the string that create the stylesheet which will be injected
 * later within <style></style> tag.
 *
 * -join/replace to transform an array objects to css-styled string
 *
 * @memberof NgxPrintJgDirective
 */
public returnStyleValues() {
  return `<style> ${this._printStyle.join(' ').replace(/,/g,';')} </style>`;
  }

  /**
   *
   *
   * @returns html for the given tag
   *
   * @memberof NgxPrintJgDirective
   */
  private _styleSheetFile = '';

  /**
   * @memberof NgxPrintJgDirective
   * @param cssList
   */
  @Input()
  set styleSheetFile(cssList: string) {
    let linkTagFn = function(cssFileName) {
      return `<link rel="stylesheet" type="text/css" href="${cssFileName}">`;
    }
    if (cssList.indexOf(',') !== -1) {
      const valueArr = cssList.split(',');
      for (let val of valueArr) {
        this._styleSheetFile = this._styleSheetFile + linkTagFn(val);
      }
    } else {
      this._styleSheetFile = linkTagFn(cssList);
    }
  }
  /**
   *
   *
   * @memberof NgxPrintJgDirective
   */
  @Input() saveOrPrint: string;
  /**
   * @returns string which contains the link tags containing the css which will
   * be injected later within <head></head> tag.
   *
   */
  private returnStyleSheetLinkTags() {
    return this._styleSheetFile;
  }
  private getElementTag(tag: keyof HTMLElementTagNameMap): string {
    const html: string[] = [];
    const elements = document.getElementsByTagName(tag);
    for (let index = 0; index < elements.length; index++) {
      html.push(elements[index].outerHTML);
    }
    return html.join('\r\n');
  }

  /**
   *
   * @param data the html element collection to save defaults to
   *
   */
  private getFormData(data: any) {
    for (var i = 0; i < data.length; i++) {
      data[i].defaultValue = data[i].value;
      if(data[i].checked) {
        data[i].defaultChecked = true;
      }
    }
  }

  /**
   * @returns html section to be printed along with some associated inputs
   *
   */
  private getHtmlContents() {
    let printContents = document.getElementById(this.printSectionId);
    let innards = printContents.getElementsByTagName('input');
    this.getFormData(innards);

    let txt = printContents.getElementsByTagName('textarea');
    this.getFormData(txt);

    return printContents.innerHTML;
  }

  /**
   *
   *
   * @memberof NgxPrintJgDirective
   */
  @HostListener('click')
  public print(): void {
    let printContents, popupWin, styles = '', links = '';
    const baseTag = this.getElementTag('base');

    if (this.useExistingCss) {
      styles = this.getElementTag('style');
      links = this.getElementTag('link');
    }

    printContents = this.getHtmlContents();
    if (this.saveOrPrint == "save") {
      let fileName = this.printTitle + '.pdf';
      let blob = new Blob([printContents], {type: "application/pdf"});
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        //save file for IE
        window.navigator.msSaveOrOpenBlob(blob, fileName);
      } else {
        //save for other browsers: Chrome, Firefox

        const objectUrl: string = URL.createObjectURL(blob);
        const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;

        a.href = objectUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }
    } else {
      popupWin = window.open("", "_blank", "top=0,left=0,height=auto,width=auto");
      popupWin.document.open();
      popupWin.document.write(`
      <html>
        <head>
          <title>${this.printTitle ? this.printTitle : ""}</title>
          ${baseTag}
          ${this.returnStyleValues()}
          ${this.returnStyleSheetLinkTags()}
          ${styles}
          ${links}
        </head>
        <body>
          ${printContents}
          <script defer>
            function triggerPrint(event) {
              window.removeEventListener('load', triggerPrint, false);
              setTimeout(function() {
                      closeWindow(window.print());
              }, ${this.printDelay});
            }
            function closeWindow(){
                window.close();
            }
            window.addEventListener('load', triggerPrint, false);
          </script>
        </body>
      </html>`);
      popupWin.document.close();
    }
  }
}
