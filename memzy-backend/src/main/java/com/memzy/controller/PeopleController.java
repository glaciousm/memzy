package com.memzy.controller;

import com.memzy.dto.FaceDto;
import com.memzy.dto.PersonDto;
import com.memzy.model.Face;
import com.memzy.model.Person;
import com.memzy.model.User;
import com.memzy.repository.FaceRepository;
import com.memzy.repository.PersonRepository;
import com.memzy.repository.UserRepository;
import com.memzy.service.FaceRecognitionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/people")
public class PeopleController {

    private static final Logger logger = LoggerFactory.getLogger(PeopleController.class);

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private FaceRepository faceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FaceRecognitionService faceRecognitionService;

    @GetMapping
    public ResponseEntity<?> getAllPeople() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Person> people = personRepository.findByUserIdOrderByFaceCountDesc(user.getId());

            List<PersonDto> dtos = people.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get people", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPersonById(@PathVariable Long id) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Person person = personRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Person not found"));

            if (!person.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }

            PersonDto dto = convertToDto(person);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to get person", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createPerson(@RequestBody Map<String, String> request) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String name = request.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
            }

            Person person = Person.builder()
                    .user(user)
                    .name(name)
                    .description(request.get("description"))
                    .faceCount(0L)
                    .build();

            person = personRepository.save(person);

            PersonDto dto = convertToDto(person);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to create person", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePerson(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Person person = personRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Person not found"));

            if (!person.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }

            if (request.containsKey("name")) {
                person.setName(request.get("name"));
            }
            if (request.containsKey("description")) {
                person.setDescription(request.get("description"));
            }

            person = personRepository.save(person);

            PersonDto dto = convertToDto(person);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to update person", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePerson(@PathVariable Long id) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Person person = personRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Person not found"));

            if (!person.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }

            // Unassign all faces
            List<Face> faces = faceRepository.findByPerson(person);
            for (Face face : faces) {
                face.setPerson(null);
                face.setIsVerified(false);
                faceRepository.save(face);
            }

            personRepository.delete(person);

            return ResponseEntity.ok(Map.of("message", "Person deleted successfully"));
        } catch (Exception e) {
            logger.error("Failed to delete person", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/faces")
    public ResponseEntity<?> getPersonFaces(@PathVariable Long id) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Person person = personRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Person not found"));

            if (!person.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized"));
            }

            List<Face> faces = faceRepository.findByPerson(person);

            List<FaceDto> dtos = faces.stream()
                    .map(this::convertFaceToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get person faces", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/faces/{faceId}/assign")
    public ResponseEntity<?> assignFace(@PathVariable Long faceId, @RequestBody Map<String, Long> request) {
        try {
            Long personId = request.get("personId");
            if (personId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "personId is required"));
            }

            Face face = faceRecognitionService.assignFaceToPerson(faceId, personId);
            FaceDto dto = convertFaceToDto(face);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to assign face", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/faces/{faceId}/unassign")
    public ResponseEntity<?> unassignFace(@PathVariable Long faceId) {
        try {
            Face face = faceRecognitionService.unassignFaceFromPerson(faceId);
            FaceDto dto = convertFaceToDto(face);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to unassign face", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/faces/{faceId}/suggestions")
    public ResponseEntity<?> getSuggestionsForFace(@PathVariable Long faceId) {
        try {
            List<Map<String, Object>> suggestions = faceRecognitionService.suggestPeopleForFace(faceId);
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            logger.error("Failed to get suggestions", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/auto-assign")
    public ResponseEntity<?> autoAssignFaces() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            faceRecognitionService.autoAssignFaces(user.getId());

            return ResponseEntity.ok(Map.of("message", "Auto-assignment started in background"));
        } catch (Exception e) {
            logger.error("Failed to start auto-assignment", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cluster")
    public ResponseEntity<?> clusterUnassignedFaces() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<List<Face>> clusters = faceRecognitionService.clusterUnassignedFaces(user.getId());

            List<List<FaceDto>> clusterDtos = clusters.stream()
                    .map(cluster -> cluster.stream()
                            .map(this::convertFaceToDto)
                            .collect(Collectors.toList()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(clusterDtos);
        } catch (Exception e) {
            logger.error("Failed to cluster faces", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id1}/merge/{id2}")
    public ResponseEntity<?> mergePeople(
            @PathVariable Long id1,
            @PathVariable Long id2,
            @RequestBody Map<String, String> request
    ) {
        try {
            String newName = request.get("name");
            Person mergedPerson = faceRecognitionService.mergePeople(id1, id2, newName);

            PersonDto dto = convertToDto(mergedPerson);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("Failed to merge people", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/faces/unassigned")
    public ResponseEntity<?> getUnassignedFaces() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Face> faces = faceRepository.findUnassignedByUserId(user.getId());

            List<FaceDto> dtos = faces.stream()
                    .map(this::convertFaceToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("Failed to get unassigned faces", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private PersonDto convertToDto(Person person) {
        return PersonDto.builder()
                .id(person.getId())
                .name(person.getName())
                .description(person.getDescription())
                .thumbnailPath(person.getThumbnailPath())
                .faceCount(person.getFaceCount())
                .createdAt(person.getCreatedAt())
                .updatedAt(person.getUpdatedAt())
                .build();
    }

    private FaceDto convertFaceToDto(Face face) {
        return FaceDto.builder()
                .id(face.getId())
                .mediaId(face.getMediaFile().getId())
                .personId(face.getPerson() != null ? face.getPerson().getId() : null)
                .personName(face.getPerson() != null ? face.getPerson().getName() : null)
                .x(face.getX())
                .y(face.getY())
                .width(face.getWidth())
                .height(face.getHeight())
                .confidence(face.getConfidence())
                .isVerified(face.getIsVerified())
                .detectedAt(face.getDetectedAt())
                .build();
    }
}
