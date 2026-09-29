import { useEffect, useState } from "react";
import "./App.css";

const API = "https://agriculture-crop-management-system.onrender.com";

const icons = {
  dashboard: "⌂",
  farmers: "♙",
  fields: "♧",
  crops: "♣",
  cultivation: "⚒",
  irrigation: "◌",
  fertilizer: "⚗",
  harvest: "▣",
};

const idFields = {
  Farmers: "farmer_id",
  Fields: "field_id",
  Crops: "crop_id",
  Cultivation: "cultivation_id",
  Irrigation: "irrigation_id",
  Fertilizer: "fertilizer_id",
  Harvest: "harvest_id",
};

const endpoints = {
  Farmers: "farmers",
  Fields: "fields",
  Crops: "crops",
  Cultivation: "cultivations",
  Irrigation: "irrigations",
  Fertilizer: "fertilizers",
  Harvest: "harvests",
};

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [farmers, setFarmers] = useState([]);
  const [fields, setFields] = useState([]);
  const [crops, setCrops] = useState([]);
  const [cultivations, setCultivations] = useState([]);
  const [irrigations, setIrrigations] = useState([]);
  const [fertilizers, setFertilizers] = useState([]);
  const [harvests, setHarvests] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [modalPage, setModalPage] = useState("");
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const collections = [
    ["farmers", setFarmers],
    ["fields", setFields],
    ["crops", setCrops],
    ["cultivations", setCultivations],
    ["irrigations", setIrrigations],
    ["fertilizers", setFertilizers],
    ["harvests", setHarvests],
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    await Promise.all(
      collections.map(async ([name, setter]) => {
        try {
          const response = await fetch(`${API}/${name}`);

          if (response.ok) {
            setter(await response.json());
          }
        } catch (error) {
          console.error(`${name} API failed`, error);
        }
      })
    );

    setLoading(false);
  };

  const navigate = (page) => {
    setActivePage(page);
    setSearchTerm("");
    setSidebarOpen(false);
  };

  const farmerName = (id) =>
    farmers.find(
      (item) => Number(item.farmer_id) === Number(id)
    )?.farmer_name || `Farmer #${id}`;

  const fieldName = (id) =>
    fields.find(
      (item) => Number(item.field_id) === Number(id)
    )?.field_name || `Field #${id}`;

  const cropName = (id) =>
    crops.find(
      (item) => Number(item.crop_id) === Number(id)
    )?.crop_name || `Crop #${id}`;

  const cultivationName = (id) => {
    const cultivation = cultivations.find(
      (item) =>
        Number(item.cultivation_id) === Number(id)
    );

    if (!cultivation) {
      return `Cultivation #${id}`;
    }

    return `${cropName(cultivation.crop_id)} · ${fieldName(
      cultivation.field_id
    )}`;
  };

  const formatValue = (key, value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    if (key === "farmer_id") {
      return `${farmerName(value)} (#${value})`;
    }

    if (key === "field_id") {
      return `${fieldName(value)} (#${value})`;
    }

    if (key === "crop_id") {
      return `${cropName(value)} (#${value})`;
    }

    if (key === "cultivation_id") {
      return cultivationName(value);
    }

    return String(value);
  };

  const getFormConfig = (page) => {
    switch (page) {
      case "Farmers":
        return {
          title: editingId ? "Edit Farmer" : "Add Farmer",
          fields: [
            ["farmer_name", "Farmer Name", "text", true],
            ["phone", "Phone Number", "text", false],
            ["village", "Village", "text", true],
          ],
        };

      case "Fields":
        return {
          title: editingId ? "Edit Field" : "Add Field",
          fields: [
            [
              "farmer_id",
              "Farmer",
              "select",
              true,
              farmers.map((item) => [
                item.farmer_id,
                `${item.farmer_name} (#${item.farmer_id})`,
              ]),
            ],
            ["field_name", "Field Name", "text", true],
            ["area_acres", "Area (Acres)", "number", true],
            ["soil_type", "Soil Type", "text", false],
            [
              "irrigation_type",
              "Irrigation Type",
              "text",
              false,
            ],
          ],
        };

      case "Crops":
        return {
          title: editingId ? "Edit Crop" : "Add Crop",
          fields: [
            ["crop_name", "Crop Name", "text", true],
            ["crop_type", "Crop Type", "text", false],
            ["season", "Season", "text", false],
            ["duration_days", "Duration (Days)", "number", false],
          ],
        };

      case "Cultivation":
        return {
          title: editingId
            ? "Edit Cultivation"
            : "Add Cultivation",
          fields: [
            [
              "field_id",
              "Field",
              "select",
              true,
              fields.map((item) => [
                item.field_id,
                `${item.field_name} (#${item.field_id})`,
              ]),
            ],
            [
              "crop_id",
              "Crop",
              "select",
              true,
              crops.map((item) => [
                item.crop_id,
                `${item.crop_name} (#${item.crop_id})`,
              ]),
            ],
            ["sowing_date", "Sowing Date", "date", true],
            [
              "expected_harvest_date",
              "Expected Harvest Date",
              "date",
              false,
            ],
            [
              "quantity_planted",
              "Quantity Planted",
              "number",
              false,
            ],
            [
              "status",
              "Status",
              "select",
              false,
              [
                ["Active", "Active"],
                ["Completed", "Completed"],
                ["Cancelled", "Cancelled"],
              ],
            ],
          ],
        };

      case "Irrigation":
        return {
          title: editingId
            ? "Edit Irrigation"
            : "Add Irrigation",
          fields: [
            [
              "cultivation_id",
              "Cultivation",
              "select",
              true,
              cultivations.map((item) => [
                item.cultivation_id,
                cultivationName(item.cultivation_id),
              ]),
            ],
            [
              "irrigation_date",
              "Irrigation Date",
              "date",
              true,
            ],
            [
              "water_quantity",
              "Water Quantity",
              "number",
              false,
            ],
            ["method", "Method", "text", false],
            ["remarks", "Remarks", "text", false],
          ],
        };

      case "Fertilizer":
        return {
          title: editingId
            ? "Edit Fertilizer"
            : "Add Fertilizer",
          fields: [
            [
              "cultivation_id",
              "Cultivation",
              "select",
              true,
              cultivations.map((item) => [
                item.cultivation_id,
                cultivationName(item.cultivation_id),
              ]),
            ],
            [
              "fertilizer_name",
              "Fertilizer Name",
              "text",
              true,
            ],
            ["quantity", "Quantity", "number", false],
            [
              "application_date",
              "Application Date",
              "date",
              true,
            ],
            ["remarks", "Remarks", "text", false],
          ],
        };

      case "Harvest":
        return {
          title: editingId
            ? "Edit Harvest"
            : "Add Harvest",
          fields: [
            [
              "cultivation_id",
              "Cultivation",
              "select",
              true,
              cultivations.map((item) => [
                item.cultivation_id,
                cultivationName(item.cultivation_id),
              ]),
            ],
            ["harvest_date", "Harvest Date", "date", true],
            [
              "quantity_harvested",
              "Quantity Harvested",
              "number",
              false,
            ],
            [
              "quality_grade",
              "Quality Grade",
              "text",
              false,
            ],
            [
              "selling_price",
              "Selling Price",
              "number",
              false,
            ],
            ["remarks", "Remarks", "text", false],
          ],
        };

      default:
        return {
          title: "",
          fields: [],
        };
    }
  };

  const openAdd = (page) => {
    setModalPage(page);
    setEditingId(null);

    const config = getFormConfig(page);
    const initialData = {};

    config.fields.forEach(([name]) => {
      initialData[name] =
        name === "status" ? "Active" : "";
    });

    setFormData(initialData);
    setShowModal(true);
  };

  const openEdit = (page, item) => {
    const copy = { ...item };

    Object.keys(copy).forEach((key) => {
      if (key.includes("date") && copy[key]) {
        copy[key] = String(copy[key]).slice(0, 10);
      }
    });

    setModalPage(page);
    setEditingId(item[idFields[page]]);
    setFormData(copy);
    setShowModal(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);

    try {
      const payload = { ...formData };

      const numericFields = [
        "farmer_id",
        "area_acres",
        "duration_days",
        "field_id",
        "crop_id",
        "quantity_planted",
        "cultivation_id",
        "water_quantity",
        "quantity",
        "quantity_harvested",
        "selling_price",
      ];

      numericFields.forEach((field) => {
        if (
          payload[field] !== undefined &&
          payload[field] !== ""
        ) {
          payload[field] = Number(payload[field]);
        }
      });

      Object.keys(payload).forEach((key) => {
        if (payload[key] === "") {
          payload[key] = null;
        }
      });

      const endpoint = endpoints[modalPage];
      const editing = editingId !== null;

      const url = editing
        ? `${API}/${endpoint}/${editingId}`
        : `${API}/${endpoint}`;

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = `Unable to ${
          editing ? "update" : "add"
        } ${modalPage}`;

        try {
          const data = await response.json();

          if (data.detail) {
            message =
              typeof data.detail === "string"
                ? data.detail
                : JSON.stringify(data.detail);
          }
        } catch {
          // default message
        }

        throw new Error(message);
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({});

      await loadData();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (page, item) => {
    const id = item[idFields[page]];

    const confirmed = window.confirm(
      `Delete this ${page
        .slice(0, -1)
        .toLowerCase()}?\n\nID: ${id}`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/${endpoints[page]}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Unable to delete ${page}`);
      }

      await loadData();
    } catch (error) {
      alert(error.message);
    }
  };

  const menu = [
    ["Dashboard", "dashboard"],
    ["Farmers", "farmers"],
    ["Fields", "fields"],
    ["Crops", "crops"],
    ["Cultivation", "cultivation"],
    ["Irrigation", "irrigation"],
    ["Fertilizer", "fertilizer"],
    ["Harvest", "harvest"],
  ];

  const stat = (label, value, icon, note) => (
    <div className="stat-card">
      <div className="stat-symbol">{icons[icon]}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const active = cultivations.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "active"
    ).length;

    const completed = cultivations.filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "completed"
    ).length;

    const area = fields.reduce(
      (sum, item) =>
        sum + Number(item.area_acres || 0),
      0
    );

    const water = irrigations.reduce(
      (sum, item) =>
        sum + Number(item.water_quantity || 0),
      0
    );

    const harvestQty = harvests.reduce(
      (sum, item) =>
        sum + Number(item.quantity_harvested || 0),
      0
    );

    const sales = harvests.reduce(
      (sum, item) =>
        sum + Number(item.selling_price || 0),
      0
    );

    return (
      <>
        <div className="hero">
          <div>
            <span className="eyebrow">
              SMART AGRICULTURE MANAGEMENT
            </span>

            <h1>Good evening, Admin.</h1>

            <p>
              Here's what's happening across your
              agricultural operations.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          {stat(
            "Total Farmers",
            farmers.length,
            "farmers",
            "Registered farmers"
          )}

          {stat(
            "Total Fields",
            fields.length,
            "fields",
            `${area.toFixed(1)} acres managed`
          )}

          {stat(
            "Total Crops",
            crops.length,
            "crops",
            "Crop varieties"
          )}

          {stat(
            "Cultivations",
            cultivations.length,
            "cultivation",
            `${active} currently active`
          )}

          {stat(
            "Irrigation",
            irrigations.length,
            "irrigation",
            `${water.toLocaleString()} water units`
          )}

          {stat(
            "Harvest Records",
            harvests.length,
            "harvest",
            `${harvestQty.toLocaleString()} units harvested`
          )}
        </div>

        <div className="dashboard-grid">
          <section className="card">
            <div className="card-head">
              <div>
                <span className="section-label">
                  OPERATIONS
                </span>

                <h2>Agricultural overview</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("Cultivation")
                }
              >
                View records →
              </button>
            </div>

            <div className="operation-area">
              <div className="circle-chart">
                <div>
                  <strong>
                    {cultivations.length}
                  </strong>
                  <span>cultivations</span>
                </div>
              </div>

              <div className="status-list">
                <div>
                  <span>
                    <i className="green-dot" />
                    Active
                  </span>
                  <b>{active}</b>
                </div>

                <div>
                  <span>
                    <i className="gray-green-dot" />
                    Completed
                  </span>
                  <b>{completed}</b>
                </div>

                <div>
                  <span>
                    <i className="light-dot" />
                    Other
                  </span>
                  <b>
                    {Math.max(
                      cultivations.length -
                        active -
                        completed,
                      0
                    )}
                  </b>
                </div>
              </div>
            </div>

            <div className="metrics">
              <div>
                <span>AREA MANAGED</span>
                <b>{area.toFixed(1)} ac</b>
              </div>

              <div>
                <span>WATER USAGE</span>
                <b>{water.toLocaleString()}</b>
              </div>

              <div>
                <span>HARVEST VALUE</span>
                <b>
                  ₹
                  {sales.toLocaleString(
                    "en-IN"
                  )}
                </b>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <span className="section-label">
                  CROP CATALOG
                </span>

                <h2>Crop overview</h2>
              </div>

              <button
                className="round-arrow"
                onClick={() =>
                  navigate("Crops")
                }
              >
                →
              </button>
            </div>

            <div className="crop-list">
              {crops.slice(0, 5).map((crop) => (
                <button
                  className="crop-row"
                  key={crop.crop_id}
                  onClick={() =>
                    navigate("Crops")
                  }
                >
                  <span className="crop-mark">
                    {icons.crops}
                  </span>

                  <span className="crop-info">
                    <b>{crop.crop_name}</b>

                    <small>
                      {crop.crop_type ||
                        "Crop"}{" "}
                      ·{" "}
                      {crop.season ||
                        "Season not set"}
                    </small>
                  </span>

                  <em>
                    {crop.duration_days
                      ? `${crop.duration_days}d`
                      : "—"}
                  </em>
                </button>
              ))}

              {!crops.length && (
                <div className="empty-inline">
                  No crops added yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="card">
            <div className="card-head">
              <div>
                <span className="section-label">
                  RECENT ACTIVITY
                </span>

                <h2>Recent farmers</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("Farmers")
                }
              >
                View all →
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Village</th>
                    <th>Phone</th>
                  </tr>
                </thead>

                <tbody>
                  {[...farmers]
                    .sort(
                      (a, b) =>
                        Number(b.farmer_id) -
                        Number(a.farmer_id)
                    )
                    .slice(0, 5)
                    .map((farmer) => (
                      <tr
                        key={farmer.farmer_id}
                      >
                        <td>
                          <div className="person">
                            <span className="avatar">
                              {farmer.farmer_name
                                ?.charAt(0)
                                .toUpperCase()}
                            </span>

                            <span>
                              <b>
                                {
                                  farmer.farmer_name
                                }
                              </b>

                              <small>
                                #
                                {
                                  farmer.farmer_id
                                }
                              </small>
                            </span>
                          </div>
                        </td>

                        <td>
                          {farmer.village}
                        </td>

                        <td>
                          {farmer.phone || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <span className="section-label">
                  PRODUCTION
                </span>

                <h2>Harvest summary</h2>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  navigate("Harvest")
                }
              >
                View all →
              </button>
            </div>

            <div className="harvest-summary">
              <div>
                <span>TOTAL HARVESTED</span>

                <strong>
                  {harvestQty.toLocaleString()}
                </strong>

                <small>production units</small>
              </div>

              <div>
                <span>RECORDED VALUE</span>

                <strong>
                  ₹
                  {sales.toLocaleString(
                    "en-IN"
                  )}
                </strong>

                <small>total selling price</small>
              </div>
            </div>

            <div className="mini-list">
              {harvests
                .slice(-3)
                .reverse()
                .map((harvest) => (
                  <div
                    key={harvest.harvest_id}
                  >
                    <span>
                      {cultivationName(
                        harvest.cultivation_id
                      )}
                    </span>

                    <b>
                      {
                        harvest.quantity_harvested
                      }
                    </b>
                  </div>
                ))}
            </div>
          </section>
        </div>

        <section className="card">
          <div className="card-head">
            <div>
              <span className="section-label">
                LAND MANAGEMENT
              </span>

              <h2>Field overview</h2>
            </div>

            <button
              className="text-button"
              onClick={() =>
                navigate("Fields")
              }
            >
              Manage fields →
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Farmer</th>
                  <th>Area</th>
                  <th>Soil</th>
                  <th>Irrigation</th>
                </tr>
              </thead>

              <tbody>
                {fields.map((field) => (
                  <tr key={field.field_id}>
                    <td>
                      <b>{field.field_name}</b>

                      <small className="sub">
                        #{field.field_id}
                      </small>
                    </td>

                    <td>
                      {farmerName(
                        field.farmer_id
                      )}
                    </td>

                    <td>
                      {field.area_acres} ac
                    </td>

                    <td>
                      <span className="badge">
                        {field.soil_type ||
                          "Not set"}
                      </span>
                    </td>

                    <td>
                      {field.irrigation_type ||
                        "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  const renderTablePage = () => {
    const dataMap = {
      Farmers: farmers,
      Fields: fields,
      Crops: crops,
      Cultivation: cultivations,
      Irrigation: irrigations,
      Fertilizer: fertilizers,
      Harvest: harvests,
    };

    const data = dataMap[activePage] || [];

    const filteredData = data.filter((item) =>
      Object.values(item).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )
      )
    );

    const singular = {
      Farmers: "Farmer",
      Fields: "Field",
      Crops: "Crop",
      Cultivation: "Cultivation",
      Irrigation: "Irrigation",
      Fertilizer: "Fertilizer",
      Harvest: "Harvest",
    }[activePage];

    return (
      <>
        <div className="page-head">
          <div>
            <span className="section-label">
              {activePage.toUpperCase()}
            </span>

            <h1>{activePage}</h1>

            <p>
              Manage and maintain your{" "}
              {activePage.toLowerCase()} records.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              openAdd(activePage)
            }
          >
            + Add {singular}
          </button>
        </div>

        <section className="card data-card">
          <div className="toolbar">
            <div className="search-box">
              <span>⌕</span>

              <input
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder={`Search ${activePage.toLowerCase()}...`}
              />
            </div>

            <span className="record-count">
              {filteredData.length} of{" "}
              {data.length} records
            </span>
          </div>

          {loading ? (
            <div className="loading">
              Loading records...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-symbol">
                ◫
              </div>

              <h3>
                No {activePage.toLowerCase()} found
              </h3>

              <p>
                Add a record or change your search.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  openAdd(activePage)
                }
              >
                + Add {singular}
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(data[0]).map(
                      (key) => (
                        <th key={key}>
                          {key.replaceAll(
                            "_",
                            " "
                          )}
                        </th>
                      )
                    )}

                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map(
                    (item, index) => (
                      <tr key={index}>
                        {Object.entries(
                          item
                        ).map(
                          ([key, value]) => (
                            <td key={key}>
                              {formatValue(
                                key,
                                value
                              )}
                            </td>
                          )
                        )}

                        <td>
                          <div className="actions">
                            <button
                              className="edit-btn"
                              onClick={() =>
                                openEdit(
                                  activePage,
                                  item
                                )
                              }
                            >
                              ✎
                            </button>

                            <button
                              className="delete-btn"
                              onClick={() =>
                                remove(
                                  activePage,
                                  item
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  };

  const renderModal = () => {
    if (!showModal) return null;

    const config = getFormConfig(modalPage);

    return (
      <div
        className="modal-overlay"
        onMouseDown={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            setShowModal(false);
          }
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <div>
              <span className="section-label">
                {editingId
                  ? "EDIT RECORD"
                  : "NEW RECORD"}
              </span>

              <h2>{config.title}</h2>

              <p>
                Enter the details below.
              </p>
            </div>

            <button
              className="close-btn"
              onClick={() =>
                setShowModal(false)
              }
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="form-grid">
              {config.fields.map(
                (
                  [
                    name,
                    label,
                    type,
                    required,
                    options,
                  ]
                ) => (
                  <label key={name}>
                    <span>
                      {label}
                      {required && (
                        <em>*</em>
                      )}
                    </span>

                    {type === "select" ? (
                      <select
                        value={
                          formData[name] ?? ""
                        }
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            [name]:
                              event.target
                                .value,
                          })
                        }
                        required={required}
                      >
                        <option value="">
                          Select {label}
                        </option>

                        {options?.map(
                          (option) => (
                            <option
                              key={option[0]}
                              value={option[0]}
                            >
                              {option[1]}
                            </option>
                          )
                        )}
                      </select>
                    ) : (
                      <input
                        type={type}
                        step={
                          type === "number"
                            ? "0.01"
                            : undefined
                        }
                        value={
                          formData[name] ?? ""
                        }
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            [name]:
                              event.target
                                .value,
                          })
                        }
                        required={required}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    )}
                  </label>
                )
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : `Add ${modalPage}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            A
          </div>

          <div>
            <b>AgriCrop</b>
            <small>
              Management Platform
            </small>
          </div>
        </div>

        <div className="workspace-label">
          WORKSPACE
        </div>

        <nav>
          {menu.map(([name, icon]) => (
            <button
              key={name}
              className={
                activePage === name
                  ? "active"
                  : ""
              }
              onClick={() =>
                navigate(name)
              }
            >
              <span className="nav-icon">
                {icons[icon]}
              </span>

              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="database-card">
            <span className="connection-dot" />

            <div>
              <b>Oracle Database</b>
              <small>
                Connected · Live
              </small>
            </div>
          </div>

          <div className="sidebar-user">
            <span className="avatar">
              S
            </span>

            <div>
              <b>Administrator</b>
              <small>
                System Manager
              </small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setSidebarOpen(true)
            }
          >
            ☰
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <b>/</b>
            <strong>{activePage}</strong>
          </div>

          <div className="top-profile">
            <span className="avatar">
              S
            </span>

            <div>
              <b>Administrator</b>
              <small>System Manager</small>
            </div>
          </div>
        </header>

        <div className="content">
          {activePage === "Dashboard"
            ? renderDashboard()
            : renderTablePage()}
        </div>
      </main>

      {renderModal()}
    </div>
  );
}

export default App;