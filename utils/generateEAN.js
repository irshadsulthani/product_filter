const generateEAN = () => {
    return 'EAN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

module.exports = generateEAN;