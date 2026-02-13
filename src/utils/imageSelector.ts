const puzzleImages = [
    'https://res.cloudinary.com/dlpzdoznd/image/upload/v1767595281/02._Finally_An_Idol_by_Tate_Mumi_a7p95r.png',
    'https://res.cloudinary.com/dlpzdoznd/image/upload/v1767595281/by_toba_ww_1_cu22bh.png',
    'https://res.cloudinary.com/dlpzdoznd/image/upload/v1767595298/Tanabata1_by_higashibara_n_ps7tm5.png',
    'https://res.cloudinary.com/dlpzdoznd/image/upload/v1767595281/imagen4_vgo5ra.jpg',
    'https://res.cloudinary.com/dlpzdoznd/image/upload/v1768805490/Shura_acostada_02_AyanoAkira_art_glpvya.jpg'
];

export const getRandomPuzzleImage = () => {
    const randomIndex = Math.floor(Math.random() * puzzleImages.length);
    return puzzleImages[randomIndex];
};

// Get all puzzle images
export const getAllPuzzleImages = () => {
    return puzzleImages;
};

// Preload an image
export const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// Preload all puzzle images
export const preloadAllPuzzleImages = async () => {
    try {
        await Promise.all(puzzleImages.map(src => preloadImage(src)));
        console.log('All puzzle images preloaded');
        return true;
    } catch (error) {
        console.error('Error preloading images:', error);
        return false;
    }
};
