package com.memzy.service;

import com.memzy.model.Face;
import com.memzy.model.MediaFile;
import com.memzy.repository.FaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Service
public class FaceDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(FaceDetectionService.class);

    @Autowired
    private FaceRepository faceRepository;

    @Value("${memzy.upload.path:./uploads}")
    private String uploadPath;

    private static final double FACE_DETECTION_SCALE_FACTOR = 1.1;
    private static final int MIN_NEIGHBORS = 3;
    private static final int MIN_FACE_SIZE = 30;

    /**
     * Detect faces in a media file
     */
    @Async
    @Transactional
    public void detectFaces(MediaFile mediaFile) {
        if (mediaFile.getMediaType() != MediaFile.MediaType.IMAGE) {
            logger.info("Skipping face detection for non-image media: {}", mediaFile.getId());
            return;
        }

        try {
            File imageFile = new File(mediaFile.getFilePath());
            if (!imageFile.exists()) {
                logger.error("Image file not found: {}", imageFile.getAbsolutePath());
                return;
            }

            BufferedImage image = ImageIO.read(imageFile);
            if (image == null) {
                logger.error("Failed to read image: {}", imageFile.getAbsolutePath());
                return;
            }

            List<Face> detectedFaces = performFaceDetection(mediaFile, image);

            if (!detectedFaces.isEmpty()) {
                faceRepository.saveAll(detectedFaces);
                logger.info("Detected {} faces in media {}", detectedFaces.size(), mediaFile.getId());
            }

        } catch (Exception e) {
            logger.error("Error detecting faces in media {}: {}", mediaFile.getId(), e.getMessage(), e);
        }
    }

    /**
     * Perform face detection using a simple algorithm
     * This is a placeholder implementation. In production, you would use:
     * - OpenCV with Haar Cascades or DNN face detector
     * - DJL with RetinaFace or MTCNN
     * - TensorFlow/PyTorch models
     */
    private List<Face> performFaceDetection(MediaFile mediaFile, BufferedImage image) {
        List<Face> faces = new ArrayList<>();

        // Simple placeholder: detect faces using basic image analysis
        // This would be replaced with actual face detection algorithms

        // For now, we'll use a simple skin tone detection approach
        // In production, use OpenCV or DJL with proper face detection models

        int width = image.getWidth();
        int height = image.getHeight();

        // Simple grid-based detection (placeholder)
        // This is NOT a real face detector - just a stub for the architecture
        logger.info("Face detection called for media {} ({}x{})", mediaFile.getId(), width, height);
        logger.warn("Using placeholder face detection. Integrate OpenCV or DJL for production use.");

        // Return empty list for now - actual implementation would use ML models
        return faces;
    }

    /**
     * Extract face embedding for recognition
     * This would use FaceNet, ArcFace, or similar models
     */
    private String extractFaceEmbedding(BufferedImage faceImage) {
        // Placeholder for face embedding extraction
        // In production, this would use:
        // - FaceNet model to generate 128 or 512-dimensional embeddings
        // - ArcFace for better accuracy
        // - Store embeddings for similarity comparison

        logger.warn("Face embedding extraction not implemented. Use DJL with FaceNet model.");
        return "";
    }

    /**
     * Calculate similarity between two face embeddings
     */
    public double calculateSimilarity(String embedding1, String embedding2) {
        if (embedding1 == null || embedding2 == null || embedding1.isEmpty() || embedding2.isEmpty()) {
            return 0.0;
        }

        try {
            String[] values1 = embedding1.split(",");
            String[] values2 = embedding2.split(",");

            if (values1.length != values2.length) {
                return 0.0;
            }

            // Calculate cosine similarity
            double dotProduct = 0.0;
            double norm1 = 0.0;
            double norm2 = 0.0;

            for (int i = 0; i < values1.length; i++) {
                double v1 = Double.parseDouble(values1[i]);
                double v2 = Double.parseDouble(values2[i]);
                dotProduct += v1 * v2;
                norm1 += v1 * v1;
                norm2 += v2 * v2;
            }

            return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

        } catch (Exception e) {
            logger.error("Error calculating embedding similarity: {}", e.getMessage());
            return 0.0;
        }
    }

    /**
     * Re-detect faces for all media of a user
     */
    @Async
    public void redetectAllFaces(Long userId) {
        logger.info("Starting face re-detection for user {}", userId);
        // Implementation would iterate through all user media and detect faces
        // This is resource-intensive and should be done in batches
    }
}
