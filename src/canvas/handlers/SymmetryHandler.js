import BaseHandler from "./BaseHandler";
class SymmetryHandler extends BaseHandler {
  constructor(props) {
    super(props);
    this.symmetries = [];
  }
  addSymmetry(item, amount, center, mirror) {
    let items = [item];
    if (!items[0]) return;
    items[0].amount = amount;
    items[0].excludeFromExport = true;
    items[0].symmetryIndex = this.symmetries.length;
    items[0].symmetryCenter = center || this.canvas.view.center;
    items[0].mirror = mirror || false;
    for (let i = 1; i < amount; i++) {
      items.push(item.clone());
      items[i].amount = amount;
      items[i].symmetryIndex = this.symmetries.length;
      items[i].excludeFromExport = true;
      items[i].symmetryCenter = center || this.canvas.view.center;
      items[i].mirror = mirror;
    }
    this.symmetries.push(items);
    this.updateSymmetry(item);
  }
  updateSymmetry(item) {
    if (!this.symmetries[item.symmetryIndex]) return;
    let items = this.symmetries[item.symmetryIndex];
    let center = item.symmetryCenter;
    let vector = item.bounds.center.subtract(center);
    if (items.indexOf(item) !== 0) {
      items.unshift(items.splice(items.indexOf(item), 1)[0]);
    }
    let count = item.mirror ? items.length / 2 : items.length;
    for (let i = 0; i < count; i++) {
      if (items[i] !== item) {
        // handle single
        items[i].copyAttributes(item);
        items[i].copyContent(item);
        items[i].position = vector.add(center);
        items[i].rotate((360 / count) * i);
      }
      if(item.mirror) {
        items[i + count].copyAttributes(item);
        items[i + count].copyContent(item);
        items[i + count].position = center.add(vector);
        items[i + count].rotate((360 / items.length * 2) * i);
        items[i + count].flip();
        items[i + count].position.x = 2 * center.x - items[i].position.x;
      }
      vector.angle += 360 / count;
    }
  }
  getDistanceFromCenter(item) {
    return item.position.subtract(item.symmetryCenter);
  }
  setSymmetryCenter(item, center) {
    let distance = this.getDistanceFromCenter(item);
    let items = this.symmetries[item.symmetryIndex];
    for (let i = 0; i < items.length; i++) {
      items[i].symmetryCenter = center;
    }
    item.position = center.add(distance);
    this.updateSymmetry(item);
  }
  setFlipOn(item, flag) {
    if (!this.symmetries[item.symmetryIndex * 2]) return;
    let items = this.symmetries[2 * item.symmetryIndex];
    if (items.indexOf(item) !== 0) {
      items.unshift(items.splice(items.indexOf(item), 1)[0]);
    }
    for (let i = 1; i < items.length; i++) {
      if (items[i].mirrorItem) {
        items[i].mirrorItem.remove();
        delete items[i].mirrorItem;
      }
      items[i].remove();
    }
    items.splice(1);
    let center = item.symmetryCenter;
    let vector = item.bounds.center.subtract(center);
    if(!flag) {
      item.mirror = true;
      for (let i = 1; i < item.amount * 2; i++) {
        let clone = item.clone();
        clone.parent = this.canvas.project.activeLayer;
        items.push(clone);
        items[i].amount = item.amount;
        items[i].symmetryIndex = item.symmetryIndex;
        items[i].excludeFromExport = true;
        items[i].symmetryCenter = item.symmetryCenter;
        items[i].mirror = item.mirror;
      }
      for (let i = 0; i < items.length / 2; i++) {
        if (items[i] !== item) {
          // handle single
          items[i].copyAttributes(item);
          items[i].copyContent(item);
          items[i].position = center.add(vector);
          items[i].rotate((360 / items.length * 2) * i);
        }
        items[i + items.length / 2].copyAttributes(item);
        items[i + items.length / 2].copyContent(item);
        items[i + items.length / 2].position = center.add(vector);
        items[i + items.length / 2].rotate((360 / items.length * 2) * i);
        items[i + items.length / 2].flip();
        items[i + items.length / 2].position.x = 2 * center.x - items[i].position.x;
        vector.angle += 360 / items.length * 2;
      }
    } else {
      item.mirror = false;
      for (let i = 1; i < item.amount; i++) {
        let clone = item.clone();
        clone.parent = this.canvas.project.activeLayer;
        items.push(clone);
        items[i].amount = item.amount;
        items[i].symmetryIndex = item.symmetryIndex;
        items[i].excludeFromExport = true;
        items[i].symmetryCenter = item.symmetryCenter;
        items[i].mirror = item.mirror;
      }
      this.updateSymmetry(item);
    }
  }
  setSymmetrySides(item, value) {
    let items = this.symmetries[item.symmetryIndex];
    if (items.indexOf(item) !== 0) {
      items.unshift(items.splice(items.indexOf(item), 1)[0]);
    }
    for (let i = 1; i < items.length; i++) {
      if (items[i].mirrorItem) {
        items[i].mirrorItem.remove();
        delete items[i].mirrorItem;
      }
      items[i].remove();
    }
    items.splice(1);
    item.amount = value;
    for (let i = 1; i < item.amount * (item.mirror ? 2: 1); i++) {
      let clone = item.clone();
      clone.parent = this.canvas.project.activeLayer;
      items.push(clone);
      items[i].amount = item.amount;
      items[i].symmetryIndex = item.symmetryIndex;
      items[i].excludeFromExport = true;
      items[i].symmetryCenter = item.symmetryCenter;
      items[i].mirror = item.mirror;
    }
    this.updateSymmetry(item);
  }
  setSymmetryMirror(item, value) {
    let items = this.symmetries[item.symmetryIndex];
    for (let i = 0; i < items.length; i++) {
      items[i].mirror = value;
    }
    this.updateSymmetry(item);
  }
  exportSymmetry() {
    let output = [];
    this.symmetries.forEach((symmetry) => {
      output.push({
        amount: symmetry.length,
        element: symmetry[0] ? symmetry[0].exportJSON() : null,
        mirror: symmetry[0] ? symmetry[0].mirror : false,
        center: symmetry[0]
          ? { x: symmetry[0].symmetryCenter.x, y: symmetry[0].symmetryCenter.y }
          : { x: this.canvas.view.center.x, y: this.canvas.view.center.x.y },
      });
    });
    return output;
  }
}
export default SymmetryHandler;
