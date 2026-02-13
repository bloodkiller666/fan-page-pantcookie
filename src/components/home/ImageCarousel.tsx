import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { AdvancedImage } from '@cloudinary/react';
import { getCloudinaryImage } from '../../utils/cloudinary';
import { placeholder } from '@cloudinary/react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const ImageCarousel = () => {
    const carouselImages = [
        'imagen4_vgo5ra',
        'by_toba_ww_1_cu22bh',
        '02._Finally_An_Idol_by_Tate_Mumi_a7p95r',
        'Tanabata1_by_higashibara_n_ps7tm5',
        'image1_ehz2cc',
        'NewChura_hzkqjc',
        'IMG_2292_dsquyx',
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <Swiper
                modules={[Autoplay, Pagination, Navigation, EffectFade]}
                spaceBetween={30}
                centeredSlides={true}
                autoplay={{
                    delay: 3500,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                }}
                navigation={true}
                effect="fade"
                fadeEffect={{
                    crossFade: true
                }}
                className="rounded-2xl shadow-2xl overflow-hidden"
                style={{ height: '500px' }}
            >
                {carouselImages.map((imageName, index) => (
                    <SwiperSlide key={index}>
                        <div className="w-full h-full relative">
                            <AdvancedImage
                                cldImg={getCloudinaryImage(imageName)}
                                plugins={[placeholder({ mode: 'blur' })]}
                                className="w-full h-full object-cover"
                                alt={`Slide ${index + 1}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default ImageCarousel;
