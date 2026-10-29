console.log("API Key loaded successfully:", apiKey);


function getLocation() {
    const cache = JSON.parse(localStorage.getItem('cachedLocation')) || {};
    const now = Date.now();

    if (cache.timestamp && now - cache.timestamp < 10 * 60 * 1000) {
        useLocation(cache.lat, cache.lng);
    } else {
        navigator.geolocation.getCurrentPosition(
            pos => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                localStorage.setItem('cachedLocation', JSON.stringify({ lat, lng, timestamp: now }));
                useLocation(lat, lng);
            },
            () => {
                alert("Location access denied, using default location.");
                useLocation(10.7769, 106.7009);
            }
        );
    }
}


async function useLocation(lat, lng) {
    try {
        const { Place } = await google.maps.importLibrary("places");

        const request = {
            fields: ["id", "displayName", "rating", "photos"],
            locationRestriction: {
                center: { lat, lng },
                radius: 1500,
            },
            includedTypes: ["vegetarian_restaurant", "vegan_restaurant"],
            maxResultCount: 20,
        };

        const { places } = await Place.searchNearby(request);

        if (places.length) {
            displayCards(places);
        } else {
            alert("No places found.");
        }
    } catch (e) {
        console.error("Error fetching Places:", e);
        alert("Error fetching places.");
    }
}

function displayCards(cafes) {
    const container = document.querySelector('.cards');
    container.innerHTML = '';

    cafes.forEach((place, i) => {
        const name = place.displayName;
        const rating = place.rating || "N/A";
        const imgUrl = place.photos?.length
            ? place.photos[0].getURI({ maxWidth: 400 })
            : "https://via.placeholder.com/250x150?text=No+Image";

        const cafeData = {
            name,
            place_id: place.id,
            photo: imgUrl,
            rating,
        };

        const wrapper = document.createElement('div');
        wrapper.className = 'swipe-wrapper';
        wrapper.style.zIndex = 200 - i;

        const card = document.createElement('div');
        card.className = 'location-card';
        card.innerHTML = `
            <img src="${imgUrl}" alt="${name}" />
            <h3>${name}</h3>
            <p>⭐️ Rating: ${rating}</p>
            <p><small>Swipe right to save 💖</small></p>
        `;

        wrapper.appendChild(card);
        container.appendChild(wrapper);

        const hammertime = new Hammer(wrapper);

        function flyOff(direction) {
            wrapper.style.transform = `translateX(${direction * 600}px) rotate(${direction * 30}deg)`;
            wrapper.style.opacity = 0;

            setTimeout(() => {
                wrapper.remove();
                if (direction === 1) saveCafe(JSON.stringify(cafeData));
            }, 300);
        }

        hammertime.on("panstart", () => {
            wrapper.classList.add("dragging");
        });

        hammertime.on("panmove", (e) => {
            wrapper.style.transform = `translateX(${e.deltaX}px) rotate(${e.deltaX / 15}deg)`;
        });

        hammertime.on("panend", (e) => {
            wrapper.classList.remove("dragging");

            if (e.deltaX > 100 || e.velocityX > 0.5) {
                flyOff(1);
            } else if (e.deltaX < -100 || e.velocityX < -0.5) {
                flyOff(-1);
            } else {
                wrapper.style.transform = "";
            }
        });
    });   // closes forEach
}         // closes displayCards

function saveCafe(cafeJSON) {
            const cafe = JSON.parse(cafeJSON);
            let saved = JSON.parse(localStorage.getItem('savedCafes') || '[]');

            if (!saved.find((c) => c.place_id === cafe.place_id)) {
                saved.push(cafe);
                localStorage.setItem("savedCafes", JSON.stringify(saved));
                alert(`${cafe.name} saved!`);
            }

            else {
                alert(`${cafe.name} is already saved.`);
            }
        }

function showSaved() {
            const container = document.querySelector('.cards');
            container.innerHTML = '';

            const saved = JSON.parse(localStorage.getItem("savedCafes") || "[]");

            if (saved.length === 0) {
                container.innerHTML = "<p>No saved cafes yet 😢</p>";
                return;
            }

            saved.forEach(cafe => {
                const card = document.createElement('div');
                card.className = 'location-card';
                card.innerHTML = `
    <img src="${cafe.photo}" alt="${cafe.name}" />
    <h3>${cafe.name}</h3>
    <p>⭐️ Rating: ${cafe.rating}</p>
      `;

                container.appendChild(card);
            });
        }