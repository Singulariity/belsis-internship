import Map from 'ol/Map.js';
import View from 'ol/View.js';
import {Draw, Modify, Snap, Select} from 'ol/interaction.js';
import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {get} from 'ol/proj.js';
import { Feature } from 'ol';
import WKT from 'ol/format/WKT.js';
import $ from 'jquery';
import {Fill, Style} from 'ol/style.js';
import {click} from 'ol/events/condition.js';
import Stroke from 'ol/style/Stroke.js';

const backend_url = "http://localhost:5000";

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: {
    'fill-color': 'rgba(230, 255, 255, 0.4)',
    'stroke-color': '#33b4ff',
    'stroke-width': 1,
    'circle-radius': 7,
    'circle-fill-color': '#33b4ff',
  },
});

const extent = get('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const map = new Map({
  layers: [raster, vector],
  target: 'map',
  view: new View({
    center: [3854665, 4729726],
    zoom: 4,
    extent,
  }),
});

const selectStyle = new Style({
  fill: new Fill({
    color: '#eeeeee',
  }),
  stroke: new Stroke({
    color: 'rgba(255, 255, 255, 0.7)',
    width: 2,
  }),
});

let draw, snap, modify, select;
let working_feature;
const modeSelect = document.getElementById('mode');
const typeSelect = document.getElementById('type');
const addModal = new bootstrap.Modal(document.getElementById('modal'), {
  keyboard: false
});
const editModal = new bootstrap.Modal(document.getElementById('edit-modal'), {
  keyboard: false
});

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  draw.on('drawend', function (e) {
    working_feature = e.feature;
    addModal.show();
    /*
    last_wkt = new WKT().writeFeature(last_feature);
    console.log(last_feature.getGeometry().getCoordinates());
    console.log(new WKT().readFeature(last_wkt));
    */
  });
  map.addInteraction(draw);
  snap = new Snap({source: source});
  map.addInteraction(snap);
}

function clearInteractions() {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  map.removeInteraction(modify);
  map.removeInteraction(select);
}





// ADD FORM
const form = document.getElementById("modal-form");
form.addEventListener("submit", function() {
  loadingOverlay(true);
  addParsel(
    document.getElementById('city').value,
    document.getElementById('district').value,
    document.getElementById('street').value,
    new WKT().writeFeature(working_feature)
  ).then(
    () => {
    console.log("Successfully added.");
    reloadSourceAndTable();
    loadingOverlay(false);
  }, 
    () => {
      loadingOverlay(false);
      console.log("An error occurred while adding!");
  });
  addModal.hide();
  working_feature = null;
  clearAddForm();
});

// ADD FORM CANCEL
const btnCancel = document.getElementById("cancelBtn");
btnCancel.addEventListener("click", function() {
  source.removeFeature(working_feature);
  working_feature = null;
  addModal.hide();
  clearAddForm();
});



// EDIT FORM
const editForm = document.getElementById("edit-modal-form");
editForm.addEventListener("submit", function() {
  loadingOverlay(true);
  updateParsel(
    document.getElementById('edit-id').value,
    document.getElementById('edit-city').value,
    document.getElementById('edit-district').value,
    document.getElementById('edit-street').value,
    null
  ).then(
    () => {
    console.log("Successfully updated.");
    reloadSourceAndTable();
    loadingOverlay(false);
  }, 
    () => {
      loadingOverlay(false);
      console.log("An error occurred while editing!");
  });
  editModal.hide();
  clearEditForm();
});

// EDIT FORM CANCEL
const EditBtnCancel = document.getElementById("edit-cancelBtn");
EditBtnCancel.addEventListener("click", function() {
  editModal.hide();
  select.getFeatures().clear();
  clearEditForm();
});

function clearAddForm() {
  document.getElementById('city').value = "";
  document.getElementById('district').value = "";
  document.getElementById('street').value = "";
}

function fillEditForm(id, city, district, street) {
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-city').value = city;
  document.getElementById('edit-district').value = district;
  document.getElementById('edit-street').value = street;
}

function clearEditForm() {
  document.getElementById('edit-city').value = "";
  document.getElementById('edit-district').value = "";
  document.getElementById('edit-street').value = "";
}

function getParsel(id) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'GET',
      url: `${backend_url}/api/Parsel/${id}/get`,
      contentType: 'application/json',
      dataType: 'json',
      success: function(data) {
        console.log("Parsel found.");
        return resolve(data);
      },
      error: function(err) {
        console.log("An error occurred while getting parsel.");
        return reject(err);
      }
    });
  });
}

function getParsels() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'GET',
      url: `${backend_url}/api/Parsel/getall`,
      contentType: 'application/json',
      dataType: 'json',
      success: function(res) {
        return resolve(res);
      },
      error: function(res) {
        return reject(res);
      }
    });
  });
}

function addParsel(city, district, street, wkt) {
  let body = {
    "id": 0,
    "city": city,
    "district": district,
    "street": street,
    "wkt": wkt
  };
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: `${backend_url}/api/Parsel/add`,
      data: JSON.stringify(body),
      contentType: 'application/json',
      dataType: 'json',
      success: function(res) {
        console.log("Parsel added.");
        return resolve(res);
      },
      error: function(res) {
        console.log("An error occurred while adding parsel.");
        return reject(res);
      }
    });
  });
}

function removeParsel(id) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: `${backend_url}/api/Parsel/${id}/remove`,
      contentType: 'application/json',
      success: function(data) {
        console.log("Parsel removed.");
        return resolve(data);
      },
      error: function(err) {
        console.log("An error occurred while removing parsel.");
        return reject(err);
      }
    });
  });
}

function updateParsel(id, city, district, street, wkt) {
  return new Promise((resolve, reject) => {
    getParsel(id).then((parsel => {
      let body = {
        "id": id,
        "city": city != null ? city : parsel['city'],
        "district": district != null ? district : parsel['district'],
        "street": street != null ? street : parsel['street'],
        "wkt": wkt != null ? wkt : parsel['wkt']
      };

      $.ajax({
        type: 'PUT',
        url: `${backend_url}/api/Parsel/${id}/update`,
        data: JSON.stringify(body),
        contentType: 'application/json',
        success: function(data) {
          console.log("Parsel updated.");
          return resolve(data);
        },
        error: function(res) {
          console.log("An error occurred while updating parsel.");
          return reject(res);
        }
      });
    }),
    () => {

    });
  });
}

function reloadSourceAndTable() {
  return new Promise((resolve, reject) => {

    getParsels().then(
      (res) => {
        source.refresh();
        res.forEach((data) => {
          let feature = new WKT().readFeature(data['wkt']);
          feature.setId(data['id']);
          source.addFeature(feature);
        });

        let data = document.getElementById('data');
        for (let x = data.rows.length - 1; x > 0; x--) {
           data.deleteRow(x);
        }
        res.forEach((data) => {
          let table = document.getElementById('data').getElementsByTagName('tbody')[0];
          let row = table.insertRow();
          let _id = row.insertCell();
          let _city = row.insertCell();
          let _district = row.insertCell();
          let _street = row.insertCell();
          let _action = row.insertCell();
          _id.innerHTML = data['id'];
          _city.innerHTML = data['city'];
          _district.innerHTML = data['district'];
          _street.innerHTML = data['street'];
          _action.innerHTML = `<button type="button" id="actionEditButton" class="btn btn-warning btn-sm">Düzenle</button> ` + 
          `<button type="button" id="actionRemoveButton" class="btn btn-danger btn-sm">Sil</button>`;
        });


        resolve();
      },
      () => {
        console.log("An error occurred while reloading source.");
        reject();
      });

  })
}



// ACTION BUTTON EDIT
function actionEdit(id) {
  getParsel(id).then((parsel) => {
    fillEditForm(
      parsel['id'],
      parsel['city'],
      parsel['district'],
      parsel['street']
      );
    editModal.show();
  },
  () => {

  })
}

// ACTION BUTTON REMOVE
function actionRemove(id) {
  loadingOverlay(true);
  removeParsel(id).then(() => {
    reloadSourceAndTable();
    loadingOverlay(false);
  },
  () => {

  });
}

// ACTION BUTTONS LISTENER
document.addEventListener('click', function (e) {
  var target = e.target;
  if (target.id === "actionEditButton") {
    let $value = $(target).parent().siblings(":first").text()
    actionEdit($value);
  } else if (target.id === "actionRemoveButton") {
    let $value = $(target).parent().siblings(":first").text()
    actionRemove($value);
  }
});















/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  clearInteractions();
  if (!["Polygon", "Point", "LineString"].includes(typeSelect.value)) return;
  addInteractions();
};

modeSelect.onchange = function () {
  clearInteractions();
  if (modeSelect.value === "Draw") {
    typeSelect.disabled = false;
    if (!["Polygon", "Point", "LineString"].includes(typeSelect.value)) return;
    return addInteractions();
  } else if (modeSelect.value === "Modify") {
    modify = new Modify({source: source});
    modify.on('modifyend', function (e) {
      console.log("Modify finished.");
      let feature = e.features.getArray()[0];
      let id = feature.getId();
      loadingOverlay(true);
      updateParsel(id, null, null, null, new WKT().writeFeature(feature)).then(
        () => {
          reloadSourceAndTable();
          loadingOverlay(false);
        },
        () => loadingOverlay(false));
    });
    map.addInteraction(modify);
  } else if (modeSelect.value === "Edit" || modeSelect.value === "Delete") {
    select = new Select({condition: click, style: selectStyle});
    map.addInteraction(select);
    select.on('select', function (e) {
      if (e.target.getFeatures().length == 0) return;
      
      let feature = e.target.getFeatures().getArray()[0];

      if (modeSelect.value === "Edit") {
        getParsel(feature.getId()).then((parsel) => {
          fillEditForm(
            parsel['id'],
            parsel['city'],
            parsel['district'],
            parsel['street']
            );
          editModal.show();
        },
        () => {
  
        });
      } else if (modeSelect.value === "Delete") {
        loadingOverlay(true);
        removeParsel(feature.getId()).then(() => {
          console.log("Parsel removed.");
          select.getFeatures().clear();
          reloadSourceAndTable();
          loadingOverlay(false);
        },
        () => {

        });
      }
      

    });
  }

  typeSelect.disabled = true;
};



// ON DOCUMENT READY
$(function() {
  getParsels().then(
    (res) => {
    console.log("Database connected.");
    res.forEach((data) => {
      let feature = new WKT().readFeature(data['wkt']);
      feature.setId(data['id']);
      source.addFeature(feature);
    });
    reloadSourceAndTable();
    loadingOverlay(false);
  }, 
    () => {
      let errorModal = new bootstrap.Modal(document.getElementById('servererror'), {
        keyboard: false
      });
    loadingOverlay(false);
    errorModal.show();
    console.log("Database error!");
  });
});


const loading = document.querySelector('.loading');
// TOGGLE LOADING OVERLAY
function loadingOverlay(state) {
  if (state) {
    if (loading.classList.contains('hidden')) loading.classList.remove('hidden');
  } else {
    if (!loading.classList.contains('hidden')) loading.classList.add('hidden');
  }
}