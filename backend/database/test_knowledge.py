"""
Test the disease knowledge service.
"""

from backend.database.knowledge import disease_knowledge


print("=" * 60)
print("TESTING DISEASE KNOWLEDGE SERVICE")
print("=" * 60)

print()

print("Number of diseases:")
print(len(disease_knowledge.get_all_diseases()))

print()

print("First 10 diseases:")
print(disease_knowledge.get_all_diseases()[:10])

print()

print("Testing panic disorder...")

result = disease_knowledge.get_disease("panic disorder")

if result is None:
    print("ERROR: Disease not found!")

else:
    print("Disease:", result["disease"])
    print()
    print("Description:")
    print(result["description"])

    print()
    print("Medications:")
    print(result["medications"])

    print()
    print("Diet:")
    print(result["diet"])

    print()
    print("Precautions:")
    print(result["precautions"])

    print()
    print("Workouts:")
    print(result["workouts"])

print()
print("=" * 60)
print("KNOWLEDGE SERVICE TEST COMPLETE")
print("=" * 60)