package com.memzy.service;

import com.memzy.model.Face;
import com.memzy.model.Person;
import com.memzy.model.User;
import com.memzy.repository.FaceRepository;
import com.memzy.repository.PersonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FaceRecognitionService {

    private static final Logger logger = LoggerFactory.getLogger(FaceRecognitionService.class);
    private static final double SIMILARITY_THRESHOLD = 0.6; // Threshold for face matching

    @Autowired
    private FaceRepository faceRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private FaceDetectionService faceDetectionService;

    /**
     * Group similar unassigned faces into clusters
     */
    @Transactional
    public List<List<Face>> clusterUnassignedFaces(Long userId) {
        List<Face> unassignedFaces = faceRepository.findUnassignedByUserId(userId);

        if (unassignedFaces.isEmpty()) {
            return new ArrayList<>();
        }

        logger.info("Clustering {} unassigned faces for user {}", unassignedFaces.size(), userId);

        // Group faces by similarity using DBSCAN-like clustering
        List<List<Face>> clusters = new ArrayList<>();
        Set<Long> processed = new HashSet<>();

        for (Face face : unassignedFaces) {
            if (processed.contains(face.getId())) {
                continue;
            }

            List<Face> cluster = new ArrayList<>();
            cluster.add(face);
            processed.add(face.getId());

            // Find all similar faces
            for (Face otherFace : unassignedFaces) {
                if (processed.contains(otherFace.getId())) {
                    continue;
                }

                double similarity = faceDetectionService.calculateSimilarity(
                        face.getEmbedding(),
                        otherFace.getEmbedding()
                );

                if (similarity >= SIMILARITY_THRESHOLD) {
                    cluster.add(otherFace);
                    processed.add(otherFace.getId());
                }
            }

            if (cluster.size() >= 2) { // Only include clusters with at least 2 faces
                clusters.add(cluster);
            }
        }

        logger.info("Created {} face clusters", clusters.size());
        return clusters;
    }

    /**
     * Assign a face to a person
     */
    @Transactional
    public Face assignFaceToPerson(Long faceId, Long personId) {
        Face face = faceRepository.findById(faceId)
                .orElseThrow(() -> new RuntimeException("Face not found"));

        Person person = personRepository.findById(personId)
                .orElseThrow(() -> new RuntimeException("Person not found"));

        face.setPerson(person);
        face.setIsVerified(true);
        face = faceRepository.save(face);

        // Update person face count
        person.setFaceCount(faceRepository.countByPersonId(personId));
        personRepository.save(person);

        logger.info("Assigned face {} to person {}", faceId, personId);
        return face;
    }

    /**
     * Remove face assignment from a person
     */
    @Transactional
    public Face unassignFaceFromPerson(Long faceId) {
        Face face = faceRepository.findById(faceId)
                .orElseThrow(() -> new RuntimeException("Face not found"));

        Long personId = face.getPerson() != null ? face.getPerson().getId() : null;

        face.setPerson(null);
        face.setIsVerified(false);
        face = faceRepository.save(face);

        // Update person face count
        if (personId != null) {
            Person person = personRepository.findById(personId).orElse(null);
            if (person != null) {
                person.setFaceCount(faceRepository.countByPersonId(personId));
                personRepository.save(person);
            }
        }

        logger.info("Unassigned face {}", faceId);
        return face;
    }

    /**
     * Automatically assign unassigned faces to existing people based on similarity
     */
    @Async
    @Transactional
    public void autoAssignFaces(Long userId) {
        logger.info("Starting auto-assignment of faces for user {}", userId);

        List<Face> unassignedFaces = faceRepository.findUnassignedByUserId(userId);
        List<Person> people = personRepository.findByUserIdOrderByFaceCountDesc(userId);

        if (unassignedFaces.isEmpty() || people.isEmpty()) {
            logger.info("No unassigned faces or people found for auto-assignment");
            return;
        }

        int assignedCount = 0;

        for (Face unassignedFace : unassignedFaces) {
            Person bestMatch = null;
            double bestSimilarity = 0.0;

            // Compare with representative faces from each person
            for (Person person : people) {
                List<Face> personFaces = faceRepository.findByPerson(person)
                        .stream()
                        .limit(5) // Compare with up to 5 faces per person
                        .collect(Collectors.toList());

                for (Face personFace : personFaces) {
                    double similarity = faceDetectionService.calculateSimilarity(
                            unassignedFace.getEmbedding(),
                            personFace.getEmbedding()
                    );

                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        bestMatch = person;
                    }
                }
            }

            // Assign if similarity is above threshold
            if (bestMatch != null && bestSimilarity >= SIMILARITY_THRESHOLD) {
                unassignedFace.setPerson(bestMatch);
                unassignedFace.setIsVerified(false); // Mark as auto-assigned (not manually verified)
                faceRepository.save(unassignedFace);
                assignedCount++;
            }
        }

        // Update face counts for all people
        for (Person person : people) {
            person.setFaceCount(faceRepository.countByPersonId(person.getId()));
            personRepository.save(person);
        }

        logger.info("Auto-assigned {} faces for user {}", assignedCount, userId);
    }

    /**
     * Merge two people into one
     */
    @Transactional
    public Person mergePeople(Long personId1, Long personId2, String newName) {
        Person person1 = personRepository.findById(personId1)
                .orElseThrow(() -> new RuntimeException("Person 1 not found"));

        Person person2 = personRepository.findById(personId2)
                .orElseThrow(() -> new RuntimeException("Person 2 not found"));

        // Verify both belong to the same user
        if (!person1.getUser().getId().equals(person2.getUser().getId())) {
            throw new RuntimeException("Cannot merge people from different users");
        }

        // Move all faces from person2 to person1
        List<Face> person2Faces = faceRepository.findByPerson(person2);
        for (Face face : person2Faces) {
            face.setPerson(person1);
            faceRepository.save(face);
        }

        // Update person1 details
        person1.setName(newName != null ? newName : person1.getName());
        person1.setFaceCount(faceRepository.countByPersonId(person1.getId()));
        person1 = personRepository.save(person1);

        // Delete person2
        personRepository.delete(person2);

        logger.info("Merged person {} into person {}", personId2, personId1);
        return person1;
    }

    /**
     * Suggest people for an unassigned face
     */
    public List<Map<String, Object>> suggestPeopleForFace(Long faceId) {
        Face face = faceRepository.findById(faceId)
                .orElseThrow(() -> new RuntimeException("Face not found"));

        Long userId = face.getMediaFile().getOwner().getId();
        List<Person> people = personRepository.findByUserIdOrderByFaceCountDesc(userId);

        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (Person person : people) {
            List<Face> personFaces = faceRepository.findByPerson(person)
                    .stream()
                    .limit(3)
                    .collect(Collectors.toList());

            double maxSimilarity = 0.0;
            for (Face personFace : personFaces) {
                double similarity = faceDetectionService.calculateSimilarity(
                        face.getEmbedding(),
                        personFace.getEmbedding()
                );
                maxSimilarity = Math.max(maxSimilarity, similarity);
            }

            if (maxSimilarity >= SIMILARITY_THRESHOLD * 0.7) { // Lower threshold for suggestions
                Map<String, Object> suggestion = new HashMap<>();
                suggestion.put("personId", person.getId());
                suggestion.put("personName", person.getName());
                suggestion.put("similarity", maxSimilarity);
                suggestion.put("faceCount", person.getFaceCount());
                suggestions.add(suggestion);
            }
        }

        // Sort by similarity
        suggestions.sort((a, b) -> Double.compare(
                (Double) b.get("similarity"),
                (Double) a.get("similarity")
        ));

        return suggestions.stream().limit(5).collect(Collectors.toList());
    }
}
