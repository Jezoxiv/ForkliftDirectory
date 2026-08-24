let forklifts = [];
let selectedForkliftId = null;
let isAddingForklift = false;
let editingForkliftId = null;

// =====================================================
// DOM ЭЛЕМЕНТЫ
// =====================================================

const forkliftTableBody = document.getElementById("forkliftTableBody");

const downtimeTableBody = document.getElementById("downtimeTableBody");

const selectedForkliftNumber = document.getElementById(
  "selectedForkliftNumber",
);

const searchInput = document.getElementById("forkliftSearch");

const downtimeModal = document.getElementById("downtimeModal");

const downtimeStart = document.getElementById("downtimeStart");

const downtimeEnd = document.getElementById("downtimeEnd");

const downtimeReason = document.getElementById("downtimeReason");

const saveDowntimeButton = document.getElementById("saveDowntimeButton");

const closeDowntimeButton = document.getElementById("closeDowntimeButton");

const addDowntimeButton = document.querySelector(".addDowntimeButton");

const addForkliftButton = document.querySelector(".addForkliftButton");

const profileButton = document.querySelector(".profileButton");

// =====================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================
function validateDowntimeDates() {
  if (!downtimeStart.value) {
    alert("Дата и время начала обязательны.");
    return false;
  }

  const start = new Date(downtimeStart.value);

  if (downtimeEnd.value) {
    const end = new Date(downtimeEnd.value);
    const now = new Date();

    if (end < start) {
      alert("Дата окончания не может быть раньше даты начала.");
      return false;
    }
  }

  return true;
}

function getCurrentDateTimeLocal() {
  const now = new Date();

  const offset = now.getTimezoneOffset();

  const localTime = new Date(now.getTime() - offset * 60000);

  return localTime.toISOString().slice(0, 16);
}

function openEditDowntimeModal(downtime) {
  console.log("Редактирование простоя:", downtime);

  const modal = document.getElementById("downtimeModal");

  const startInput = document.getElementById("downtimeStart");
  const endInput = document.getElementById("downtimeEnd");
  const reasonInput = document.getElementById("downtimeReason");

  startInput.value = toDateTimeLocal(downtime.start);

  endInput.value = downtime.end ? toDateTimeLocal(downtime.end) : "";

  reasonInput.value = downtime.reason;

  modal.dataset.mode = "edit";
  modal.dataset.downtimeId = downtime.id;

  modal.style.display = "flex";
}

function toDateTimeLocal(value) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getUserFullName() {
    return localStorage.getItem("userFullName") || "";
}

function setUserFullName(name) {
    localStorage.setItem("userFullName", name);
}
function isForkliftEditing() {
    return isAddingForklift || editingForkliftId !== null;
}

function isDowntimeEditing() {
    return downtimeModal.dataset.mode === "add" ||
        downtimeModal.dataset.mode === "edit";
}

function validateForkliftFields(
    brandInput,
    numberInput,
    loadCapacityInput
) {
    const brand = brandInput.value.trim();
    const number = numberInput.value.trim();
    const loadCapacity = Number(loadCapacityInput.value);

    if (!brand) {
        alert("Введите марку погрузчика.");
        brandInput.focus();
        return null;
    }

    if (!number) {
        alert("Введите номер погрузчика.");
        numberInput.focus();
        return null;
    }

    if (!loadCapacityInput.value || loadCapacity <= 0) {
        alert("Введите корректную грузоподъёмность.");
        loadCapacityInput.focus();
        return null;
    }

    return {
        brand,
        number,
        loadCapacity
    };
}

function hasForkliftChanges(
    originalForklift,
    brandInput,
    numberInput,
    loadCapacityInput
) {
    const brand = brandInput.value.trim();
    const number = numberInput.value.trim();
    const loadCapacity = Number(loadCapacityInput.value);

    return (
        originalForklift.brand !== brand ||
        originalForklift.number !== number ||
        Number(originalForklift.loadCapacity) !== loadCapacity
    );
}

// =====================================================
// ЗАГРУЗКА ПОГРУЗЧИКОВ
// =====================================================
async function loadForklifts(selectFirst = false) {
    const response = await fetch("/api/forklifts");

    if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    forklifts = await response.json();

    renderForklifts(forklifts);

    if (selectFirst && forklifts.length > 0) {
        await selectForklift(forklifts[0].id);
    }
}

// =====================================================
// ОТРИСОВКА ТАБЛИЦЫ ПОГРУЗЧИКОВ
// =====================================================
function renderNewForkliftRow() {
    const row = document.createElement("tr");

    row.classList.add("editingRow");

    row.innerHTML = `
        <td>—</td>

        <td>
            <input
                type="text"
                class="newForkliftBrand"
                placeholder="Марка"
            >
        </td>

        <td>
            <input
                type="text"
                class="newForkliftNumber"
                placeholder="Номер"
            >
        </td>

        <td>
            <input
                type="number"
                class="newForkliftLoadCapacity"
                placeholder="Грузоподъёмность"
                min="0"
                step="0.1"
            >
        </td>

        <td>
            —
        </td>

        <td>—</td>

        <td>—</td>

        <td>
            <div class="actionIcons">

                <button
                    class="actionIcon saveForkliftIcon"
                    title="Сохранить"
                >
                    ✓
                </button>

                <button
                    class="actionIcon cancelForkliftIcon"
                    title="Отменить"
                >
                    ×
                </button>

            </div>
        </td>
    `;

    forkliftTableBody.appendChild(row);

    row.querySelector(".newForkliftBrand").focus();

    return row;
}

function renderForkliftEditRow(row, forklift) {

    row.classList.add("editingRow");

    row.innerHTML = `
        <td>${forklift.id}</td>

        <td>
            <input
                type="text"
                class="editForkliftBrand"
                value="${forklift.brand}"
            >
        </td>

        <td>
            <input
                type="text"
                class="editForkliftNumber"
                value="${forklift.number}"
            >
        </td>

        <td>
            <input
                type="number"
                class="editForkliftLoadCapacity"
                value="${forklift.loadCapacity}"
                min="0"
                step="0.1"
            >
        </td>

        <td>
            <input
                type="checkbox"
                class="activeCheck"
                ${forklift.active ? "checked" : ""}
                disabled
            >
        </td>

        <td>${formatDateTime(forklift.updatedAt)}</td>

        <td>${forklift.updatedBy ?? ""}</td>

        <td>
            <div class="actionIcons">

                <button
                    class="actionIcon saveEditForkliftIcon"
                    title="Сохранить"
                >
                    ✓
                </button>

                <button
                    class="actionIcon cancelEditForkliftIcon"
                    title="Отменить"
                >
                    ×
                </button>

            </div>
        </td>
    `;

    row.querySelector(".editForkliftBrand").focus();
}

function renderForklifts(data) {
  forkliftTableBody.innerHTML = "";

  data.forEach((forklift) => {
    const row = document.createElement("tr");

    row.dataset.id = forklift.id;

    if (forklift.id === selectedForkliftId) {
      row.classList.add("selected");
    }

    row.innerHTML = `
            <td>${forklift.id}</td>
            <td>${forklift.brand}</td>
            <td>${forklift.number}</td>
            <td>${forklift.loadCapacity}</td>

            <td>
                <input
                    type="checkbox"
                    class="activeCheck"
                    ${forklift.active ? "checked" : ""}
                    disabled
                >
            </td>

            <td>${formatDateTime(forklift.updatedAt)}</td>
            <td>${forklift.updatedBy ?? ""}</td>

            <td>
                <div class="actionIcons">

                    <button
                        class="actionIcon editIcon"
                        title="Редактировать"
                        style="transform: scaleX(-1);"
                    >
                        ✎
                    </button>

                    <button
                        class="actionIcon deleteIcon"
                        title="Удалить"
                    >
                        ×
                    </button>

                </div>
            </td>
        `;

      row.addEventListener("click", function (event) {

          if (row.classList.contains("editingRow")) {
              return;
          }

          if (isForkliftEditing()) {
              alert("Сначала завершите текущую операцию с погрузчиком.");
              return;
          }

          selectForklift(forklift.id);
      });

    const editButton = row.querySelector(".editIcon");

      editButton.addEventListener("click", function (event) {
          event.stopPropagation();

          if (isForkliftEditing()) {
              alert("Сначала завершите текущую операцию с погрузчиком.");
              return;
          }

          editingForkliftId = forklift.id;

          renderForkliftEditRow(row, forklift);
      });

      const deleteButton = row.querySelector(".deleteIcon");

      deleteButton.addEventListener("click", async function (event) {
          event.stopPropagation();

          if (isForkliftEditing()) {
              alert("Сначала завершите текущую операцию с погрузчиком.");
              return;
          }

          try {
              // Сначала проверяем, есть ли простои
              const response = await fetch(
                  `/api/forklifts/${forklift.id}/downtimes`
              );

              if (!response.ok) {
                  throw new Error(`Ошибка HTTP: ${response.status}`);
              }

              const downtimes = await response.json();

              if (downtimes.length > 0) {
                  alert(
                      "Нельзя удалить погрузчик, так как для него зарегистрированы простои."
                  );
                  return;
              }

              // Если простоев нет — спрашиваем подтверждение
              const confirmed = confirm(
                  "Удалить погрузчик? Вы уверены?"
              );

              if (!confirmed) {
                  return;
              }

              // Удаляем погрузчик
              const deleteResponse = await fetch(
                  `/api/forklifts/${forklift.id}`,
                  {
                      method: "DELETE"
                  }
              );

              if (!deleteResponse.ok) {
                  throw new Error(
                      `Ошибка HTTP: ${deleteResponse.status}`
                  );
              }

              // Обновляем таблицу
              await loadForklifts();

              // Если удалили выбранный погрузчик
              if (selectedForkliftId === forklift.id) {
                  selectedForkliftId = null;
                  selectedForkliftNumber.textContent = "";
                  downtimeTableBody.innerHTML = "";
              }

          } catch (error) {
              console.error("Ошибка удаления погрузчика:", error);

              alert("Не удалось удалить погрузчик.");
          }
      });

    forkliftTableBody.appendChild(row);
  });
}

// =====================================================
// ВЫБОР ПОГРУЗЧИКА
// =====================================================
async function selectForklift(id) {
  selectedForkliftId = id;

  const forklift = forklifts.find((item) => item.id === id);

  if (!forklift) {
    return;
  }

  document.querySelectorAll(".forkliftTable tbody tr").forEach((row) => {
    row.classList.toggle("selected", Number(row.dataset.id) === id);
  });

  selectedForkliftNumber.textContent = forklift.number;

  await loadDowntimes(id);
}

// =====================================================
// ЗАГРУЗКА ПРОСТОЕВ
// =====================================================
async function loadDowntimes(forkliftId) {
  try {
    const response = await fetch(`/api/forklifts/${forkliftId}/downtimes`);

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const downtimes = await response.json();

    renderDowntimes(downtimes);
  } catch (error) {
    console.error("Ошибка загрузки простоев:", error);

    downtimeTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Не удалось загрузить простои
                </td>
            </tr>
        `;
  }
}

// =====================================================
// ОТРИСОВКА ПРОСТОЕВ
// =====================================================
function renderDowntimes(downtimes) {
  downtimeTableBody.innerHTML = "";

  if (downtimes.length === 0) {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td colspan="6">
                Простоев не зарегистрировано
            </td>
        `;

    downtimeTableBody.appendChild(row);

    return;
  }

    downtimes.forEach((downtime) => {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${downtime.id}</td>

        <td>${formatDateTime(downtime.start)}</td>

        <td>
            ${downtime.end ? formatDateTime(downtime.end) : "Продолжается"}
        </td>

        <td>${calculateDuration(downtime.start, downtime.end)}</td>

        <td>${downtime.reason}</td>

        <td>
            <div class="actionIcons">

                <button
                    class="actionIcon editIcon"
                    title="Редактировать"
                    style="transform: scaleX(-1);"
                >
                    ✎
                </button>

                <button
                    class="actionIcon deleteIcon"
                    title="Удалить"
                >
                    ×
                </button>

            </div>
        </td>
    `;

        // Кнопка редактирования
        const editButton = row.querySelector(".editIcon");

        editButton.addEventListener("click", function (event) {
            event.stopPropagation();

            if (isForkliftEditing()) {
                alert("Сначала завершите текущую операцию с погрузчиком.");
                return;
            }

            openEditDowntimeModal(downtime);
        });

        // Кнопка удаления
        const deleteButton = row.querySelector(".deleteIcon");

        deleteButton.addEventListener("click", async function (event) {
            event.stopPropagation();

            if (isForkliftEditing()) {
                alert("Сначала завершите текущую операцию с погрузчиком.");
                return;
            }

            const confirmed = confirm(
                `Удалить простой от ${formatDateTime(downtime.start)}?\n\nПричина: ${downtime.reason}`
            );

            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(
                    `/api/forklifts/downtimes/${downtime.id}`,
                    {
                        method: "DELETE"
                    }
                );

                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }

                await loadDowntimes(selectedForkliftId);
                await loadForklifts();

            } catch (error) {
                console.error("Ошибка удаления простоя:", error);

                alert("Не удалось удалить простой.");
            }
        });

        downtimeTableBody.appendChild(row);
    });
}

// =====================================================
// ПРЕОБРАЗОВАНИЕ ДАТЫ
// =====================================================
function formatDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDuration(start, end) {
  const startDate = new Date(start);

  const endDate = end ? new Date(end) : new Date();

  const difference = endDate - startDate;

  const totalMinutes = Math.floor(difference / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours} ч ${minutes} мин`;
}

// =====================================================
// ПОИСК
// =====================================================

document.querySelector(".searchButton").addEventListener("click", function () {
  const value = searchInput.value.trim().toLowerCase();

  if (value === "") {
    renderForklifts(forklifts);
    return;
  }

  const filtered = forklifts.filter((forklift) =>
    forklift.number.toLowerCase().includes(value),
  );

  renderForklifts(filtered);
});

// =====================================================
// СБРОС ФИЛЬТРА
// =====================================================

document.querySelector(".resetFilter").addEventListener("click", function () {
  searchInput.value = "";

  renderForklifts(forklifts);
});

// =====================================================
// ДОБАВЛЕНИЕ ПРОСТОЯ
// =====================================================
addDowntimeButton.addEventListener("click", function () {

    if (isForkliftEditing()) {
        alert("Сначала завершите текущую операцию с погрузчиком.");
        return;
    }

    if (selectedForkliftId === null) {
        alert("Сначала выберите погрузчик.");
        return;
    }

    downtimeStart.value = getCurrentDateTimeLocal();

    downtimeEnd.value = "";

    downtimeReason.value = "";

    downtimeModal.dataset.mode = "add";
    delete downtimeModal.dataset.downtimeId;

    downtimeModal.style.display = "flex";
});

closeDowntimeButton.addEventListener("click", function () {
    downtimeModal.style.display = "none";

    delete downtimeModal.dataset.mode;
    delete downtimeModal.dataset.downtimeId;
});

async function updateDowntime() {
  const downtimeId = downtimeModal.dataset.downtimeId;

  if (!downtimeId) {
    alert("Не удалось определить код простоя.");
    return;
  }

  if (!validateDowntimeDates()) {
    return;
  }

  const downtime = {
    start: new Date(downtimeStart.value).toISOString(),

    end: downtimeEnd.value ? new Date(downtimeEnd.value).toISOString() : null,

    reason: downtimeReason.value.trim(),
  };

  console.log("Обновляем простой:", downtime);

  try {
    const response = await fetch(
      `/api/forklifts/${selectedForkliftId}/downtimes/${downtimeId}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(downtime),
      },
    );

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const updatedDowntime = await response.json();

    console.log("Простой успешно изменён:", updatedDowntime);

    downtimeModal.style.display = "none";

    delete downtimeModal.dataset.mode;
    delete downtimeModal.dataset.downtimeId;

    await loadDowntimes(selectedForkliftId);
    await loadForklifts();

  } catch (error) {
    console.error("Ошибка изменения простоя:", error);

    alert("Не удалось изменить простой.");
  }
}

saveDowntimeButton.addEventListener("click", async function () {
  // Если открыто редактирование
  if (downtimeModal.dataset.mode === "edit") {
    await updateDowntime();
    return;
  }
  // Иначе это добавление

  if (!validateDowntimeDates()) {
    return;
  }

  const downtime = {
    start: new Date(downtimeStart.value).toISOString(),

    end: downtimeEnd.value ? new Date(downtimeEnd.value).toISOString() : null,

    reason: downtimeReason.value.trim(),
  };

  console.log("Отправляем простой:", downtime);

  try {
    const response = await fetch(
      `/api/forklifts/${selectedForkliftId}/downtimes`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(downtime),
      },
    );

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const createdDowntime = await response.json();

    console.log("Простой успешно зарегистрирован:", createdDowntime);

    downtimeModal.style.display = "none";

      await loadDowntimes(selectedForkliftId);
      await loadForklifts();
  } catch (error) {
    console.error("Ошибка регистрации простоя:", error);

    alert("Не удалось зарегистрировать простой.");
  }
});


// =====================================================
// ДОБАВЛЕНИЕ ПОГРУЗЧИКА
// =====================================================
addForkliftButton.addEventListener("click", function () {

    if (isForkliftEditing()) {
        alert("Сначала завершите текущую операцию с погрузчиком.");
        return;
    }

    isAddingForklift = true;

    renderForklifts(forklifts);

    renderNewForkliftRow();
});

forkliftTableBody.addEventListener("click", async function (event) {
    const saveButton = event.target.closest(".saveForkliftIcon");

    if (!saveButton) {
        return;
    }

    const row = saveButton.closest("tr");

    const brandInput = row.querySelector(".newForkliftBrand");
    const numberInput = row.querySelector(".newForkliftNumber");
    const loadCapacityInput = row.querySelector(".newForkliftLoadCapacity");

    const validatedForklift = validateForkliftFields(
        brandInput,
        numberInput,
        loadCapacityInput
    );

    if (!validatedForklift) {
        return;
    }

    const forklift = {
        ...validatedForklift,
        updatedBy: getUserFullName()
    };

    console.log("Создаём погрузчик:", forklift);

    try {
        const response = await fetch("/api/forklifts", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(forklift)
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const createdForklift = await response.json();

        console.log("Погрузчик успешно создан:", createdForklift);

        isAddingForklift = false;

        await loadForklifts();

    } catch (error) {
        console.error("Ошибка создания погрузчика:", error);

        alert("Не удалось сохранить погрузчик.");
    }
});

forkliftTableBody.addEventListener("click", function (event) {
    const cancelButton = event.target.closest(".cancelForkliftIcon");

    if (!cancelButton) {
        return;
    }

    isAddingForklift = false;

    renderForklifts(forklifts);
});

forkliftTableBody.addEventListener("click", async function (event) {
    const saveButton = event.target.closest(".saveEditForkliftIcon");

    if (!saveButton) {
        return;
    }

    const row = saveButton.closest("tr");

    const id = Number(row.dataset.id);

    const brandInput = row.querySelector(".editForkliftBrand");
    const numberInput = row.querySelector(".editForkliftNumber");
    const loadCapacityInput = row.querySelector(
        ".editForkliftLoadCapacity"
    );

    const validatedForklift = validateForkliftFields(
        brandInput,
        numberInput,
        loadCapacityInput
    );

    if (!validatedForklift) {
        return;
    }

    const originalForklift = forklifts.find(
        (item) => item.id === id
    );

    if (!originalForklift) {
        alert("Не удалось найти исходные данные погрузчика.");
        return;
    }

    const hasChanges =
        originalForklift.brand !== validatedForklift.brand ||
        originalForklift.number !== validatedForklift.number ||
        Number(originalForklift.loadCapacity) !==
        Number(validatedForklift.loadCapacity);

    // Ничего не изменилось — PUT не отправляем
    if (!hasChanges) {
        editingForkliftId = null;

        renderForklifts(forklifts);

        return;
    }

    const forklift = {
        ...validatedForklift,
        updatedBy: getUserFullName()
    };

    console.log("Обновляем погрузчик:", id, forklift);

    try {
        const response = await fetch(
            `/api/forklifts/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(forklift)
            }
        );

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const updatedForklift = await response.json();

        console.log(
            "Погрузчик успешно изменён:",
            updatedForklift
        );

        editingForkliftId = null;

        await loadForklifts();

    } catch (error) {
        console.error(
            "Ошибка изменения погрузчика:",
            error
        );

        alert("Не удалось сохранить изменения.");
    }
});

forkliftTableBody.addEventListener("click", function (event) {
    const cancelButton = event.target.closest(".cancelEditForkliftIcon");

    if (!cancelButton) {
        return;
    }

    const row = cancelButton.closest("tr");

    const id = Number(row.dataset.id);

    const originalForklift = forklifts.find(
        (item) => item.id === id
    );

    if (!originalForklift) {
        editingForkliftId = null;
        renderForklifts(forklifts);
        return;
    }

    const brandInput = row.querySelector(".editForkliftBrand");
    const numberInput = row.querySelector(".editForkliftNumber");
    const loadCapacityInput = row.querySelector(
        ".editForkliftLoadCapacity"
    );

    const hasChanges = hasForkliftChanges(
        originalForklift,
        brandInput,
        numberInput,
        loadCapacityInput
    );

    if (hasChanges) {
        const confirmed = confirm(
            "Не сохранять внесенные изменения? Вы уверены?"
        );

        if (!confirmed) {
            return;
        }
    }

    editingForkliftId = null;

    renderForklifts(forklifts);
});

// =====================================================
// ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
// =====================================================
profileButton.addEventListener("click", function () {
    const userFullName = getUserFullName();

    const name = prompt(
        "Введите ФИО:",
        userFullName
    );

    if (name === null) {
        return;
    }

    const trimmedName = name.trim();

    if (trimmedName === "") {
        alert("ФИО не может быть пустым.");
        return;
    }

    setUserFullName(trimmedName);

});

// =====================================================
// ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА
// =====================================================

loadForklifts(true);