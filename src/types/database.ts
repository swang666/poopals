export type Dog = {
  id: string
  name: string
  breed: string | null
  age: number | null
  weight: number | null
  primary_food_brand: string | null
  profile_picture_url: string | null
  created_at: string
}

export type Poop = {
  id: string
  dog_id: string
  image_url: string | null
  consistency: string | null
  color: string | null
  anomalies: string | null
  health_score: number | null
  summary: string | null
  note: string | null
  privacy_setting: 'score_only' | 'photo_and_score'
  created_at: string
}

export type Friendship = {
  id: string
  dog_id_1: string
  dog_id_2: string
  status: 'pending' | 'accepted'
  created_at: string
}
