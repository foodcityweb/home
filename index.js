// Product database using a JavaScript Map for O(1) lookup time
const productDatabase = new Map([
    ['8901014004133', {
        name: 'Nissin Cup Noodles - Italian Delight Flavor',
        excessive: 'Fat(Saturated and Trans), Protein, Sodium',
        moderate: 'Carbohydrates, Added Sugar',
        lacking: 'Dietary Fiber, Vitamins',
        potential_problems: 'Obesity, Heart risks, Metabolic Issues, Hypertension'
    }],
    ['8904089974844', {
        name: 'Heritage Chocolate and Caramel Flavor',
        excessive: 'Calories, Calcium, Added Sugar',
        moderate: 'Carbohydrates, Protein',
        lacking: 'Fat, Dietary Fiber, Sodium, Preservatives',
        potential_problems: 'Obesity, Metabolic Issues'  
    }],
    ['8901719134852', {
        name: 'Parle-g Gluco Biscuits',
        excessive: 'Calories, Carbohydrates, Sugars, Saturated Fat',
        moderate: 'Protein, Fat',
        lacking: 'Dietary Fiber, Trans Fat, Sodium',
        potential_problems: 'Obesity, Metabolic Issues'  
    }]
]);


// Wait until DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
    });

    // Get references to HTML elements we'll need to interact with
    const startScannerDiv = document.getElementById('start-scanner-div');
    const stopScannerBtn = document.getElementById('stop-scanner');
    const scannerContainerDiv = document.getElementById('scanner-container-div');
    const resultContainerDiv = document.getElementById('result-container-div');
    const nameResultSpan = document.getElementById('name-result')
    const barcodeResultSpan = document.getElementById('barcode-result');
    const nutrientsP = document.getElementById('nutrients');

    // Variable to track if we've initialized Quagga before
    let quaggaInitialized = false;
    // Set to keep track of all scanned barcodes during this session
    const scannedBarcodes = new Set();
    // Cooldown timer to prevent rapid consecutive scans
    let scanCooldown = false;

    // Add click event listener to start scanner div
    startScannerDiv.addEventListener('click', function() {
        startScannerDiv.style.display = 'none';
        scannerContainerDiv.style.display = 'flex';
        resultContainerDiv.style.display = 'block';
        // Clear previously scanned barcodes when starting a new session
        scannedBarcodes.clear();
        hideOverlay(); // Start with the overlay hidden
        startScanner();
    });

    // Add click event listener to stop scanner X button
    stopScannerBtn.addEventListener('click', function() {
        stopScanner();
        scannerContainerDiv.style.display = 'none';
        startScannerDiv.style.display = 'flex';
        resultContainerDiv.style.display = 'none';
    });

    function showOverlay() {
        resultContainerDiv.style.bottom = "11%"; // Slide up to center vertically
    }
    
    function hideOverlay() {
        resultContainerDiv.style.bottom = "-50%"; // Slide back down off screen
    }

    // Function to display product information
    function displayProductInfo(product) {
        // First hide the overlay
        hideOverlay();
        
        // Update content
        nutrientsP.innerHTML = `
            Excessive: ${product.excessive}<br>
            Moderate: ${product.moderate}<br>
            Lacking: ${product.lacking}<br>
            Potential Problems: ${product.potential_problems}<br>
        `;
        
        // After a brief delay, show the overlay with new content
        setTimeout(showOverlay, 100);
    }

    // Function to initialize and start the barcode scanner
    function startScanner() {
        if (quaggaInitialized) {
            Quagga.start();
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive'),
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment"
                },
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "code_128_reader"
                ]
            },
            frequency: 5
        }, function(err) {
            if (err) {
                console.error("Error initializing Quagga:", err);
                alert("Could not access camera. Please make sure you've granted permission.");
                stopScanner();
                scannerContainerDiv.style.display = 'none';
                startScannerDiv.style.display = 'flex';
                return;
            }
            console.log("Quagga initialization finished. Ready to start.");
            quaggaInitialized = true;
            Quagga.start();
        });

        // Event listener for when a barcode is detected
        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            
            // Only check cooldown, remove the scannedBarcodes check
            if (scanCooldown) {
                return;
            }
            
            console.log("Barcode detected:", code);
            
            // Set cooldown to prevent rapid scanning
            scanCooldown = true;
            
            // Reset cooldown after 1.5 seconds
            setTimeout(() => {
                scanCooldown = false;
            }, 3000);
            
            // Hide current result
            hideOverlay();
            
            // After a brief delay to ensure hiding animation completes
            setTimeout(() => {
                if (productDatabase.has(code)){
                    nameResultSpan.innerHTML = "Name: " + productDatabase.get(code).name + "<br>";
                    barcodeResultSpan.innerHTML = "Barcode: " + code;
                    displayProductInfo(productDatabase.get(code));
                } else {
                    nameResultSpan.innerHTML = '';
                    barcodeResultSpan.innerHTML = "Barcode: " + code;
                    nutrientsP.innerHTML = `Product with barcode ${code} not found in database.`;
                    showOverlay();
                }
            }, 500);
        });
    }

    // Function to stop the barcode scanner
    function stopScanner() {
        if (Quagga) {
            Quagga.stop();
            console.log("Scanner stopped");
        }
    }
});