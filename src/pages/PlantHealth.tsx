import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ImageUpload';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const PlantHealth = () => {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    // Dummy analysis
    setAnalysis({
      disease: 'Leaf Blight',
      confidence: 87,
      severity: 'Moderate',
      treatment: [
        'Remove infected leaves immediately',
        'Apply copper-based fungicide',
        'Improve air circulation around plants',
        'Avoid overhead watering',
        'Monitor plants daily for progression',
      ],
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-3xl font-bold text-foreground">{t('plant.health')}</h1>
        <p className="text-muted-foreground">Upload leaf images to detect diseases</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('plant.uploadLeaf')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                onImageSelect={handleImageSelect}
                preview={image || undefined}
                onClear={() => {
                  setImage(null);
                  setAnalysis(null);
                }}
              />
              {image && !analysis && (
                <Button onClick={handleAnalyze} className="w-full" size="lg">
                  Analyze Plant Health
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {analysis && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{t('plant.disease')}</p>
                    <p className="text-lg font-bold text-destructive">{analysis.disease}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t('plant.confidence')}</span>
                    <span className="font-medium">{analysis.confidence}%</span>
                  </div>
                  <Progress value={analysis.confidence} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    <p className="font-medium">{t('plant.treatment')}</p>
                  </div>
                  <ul className="space-y-2">
                    {analysis.treatment.map((step: string, index: number) => (
                      <motion.li
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlantHealth;
