import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cropRecommendations } from '@/utils/dummyData';
import { TrendingUp, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const CropRecommendations = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('crop.recommendations')}</h1>
        <p className="text-muted-foreground">{t('crop.suitable')}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cropRecommendations.map((crop, index) => (
          <motion.div
            key={crop.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{crop.image}</div>
                  <div>
                    <CardTitle>{crop.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>{crop.season}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Suitability
                    </span>
                    <span className="font-medium">{crop.suitability}%</span>
                  </div>
                  <Progress value={crop.suitability} className="h-2" />
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-1">{t('crop.reason')}</p>
                  <p className="text-sm text-muted-foreground">{crop.reason}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CropRecommendations;
