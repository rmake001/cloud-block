import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const USE_NATIVE_DRIVER = Platform.OS !== "web";
const BUILDING_STORAGE_KEY = "cloudblock.selectedBuilding.v1";
const DEMO_BUILDINGS = [
  {
    id: "cloudblock",
    name: "CloudBlock Tower",
    address: "88 Cloud Street",
  },
  {
    id: "willow",
    name: "The Willow",
    address: "14 Willow Lane",
  },
  {
    id: "harbor",
    name: "Harbor House",
    address: "260 Harbor Avenue",
  },
];

function IntroSplash() {
  const progress = useRef(new Animated.Value(0)).current;
  const cloudProgress = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(250),
      Animated.timing(progress, {
        toValue: 1,
        duration: 650,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.delay(1450),
      Animated.timing(progress, {
        toValue: 2,
        duration: 850,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();

    cloudProgress.forEach((value, index) => {
      Animated.sequence([
        Animated.delay(180 + index * 260),
        Animated.timing(value, {
          toValue: 1,
          duration: 380,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.delay(850 + index * 100),
        Animated.timing(value, {
          toValue: 2,
          duration: 950,
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start();
    });
  }, [cloudProgress, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [210, 0, -30],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.18, 1, 1.65, 2],
    outputRange: [0, 1, 1, 0.75, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.72, 1, 1.16],
  });
  const clouds = [
    { style: styles.cloudTopLeft, drift: -24, scale: 0.9 },
    { style: styles.cloudTopRight, drift: 22, scale: 0.72 },
    { style: styles.cloudMidLeft, drift: -18, scale: 0.66 },
    { style: styles.cloudMidRight, drift: 25, scale: 0.95 },
    { style: styles.cloudBottom, drift: -16, scale: 0.8 },
  ];

  return (
    <View pointerEvents="none" style={styles.introLayer}>
      {clouds.map((cloud, index) => {
        const cloudOpacity = cloudProgress[index].interpolate({
          inputRange: [0, 0.25, 1, 1.7, 2],
          outputRange: [0, 0.9, 0.9, 0.5, 0],
        });
        const cloudTranslateY = cloudProgress[index].interpolate({
          inputRange: [0, 1, 2],
          outputRange: [22, 0, -28],
        });
        const cloudTranslateX = cloudProgress[index].interpolate({
          inputRange: [0, 1, 2],
          outputRange: [cloud.drift, 0, -cloud.drift],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.cloudPuff,
              cloud.style,
              {
                opacity: cloudOpacity,
                transform: [
                  { translateX: cloudTranslateX },
                  { translateY: cloudTranslateY },
                  { scale: cloud.scale },
                ],
              },
            ]}
          >
            <View style={styles.cloudPuffBase} />
            <View style={styles.cloudPuffLeft} />
            <View style={styles.cloudPuffCenter} />
            <View style={styles.cloudPuffRight} />
          </Animated.View>
        );
      })}
      <Animated.View
        style={[
          styles.cloudMark,
          { opacity, transform: [{ translateY }, { scale }] },
        ]}
      >
        <Text style={styles.cloudMarkText}>Cloud Block</Text>
      </Animated.View>
    </View>
  );
}

function HomeScreen({ building, onChangeBuilding }) {
  const zoom = useRef(new Animated.Value(0.97)).current;
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    Animated.spring(zoom, {
      toValue: 1.04,
      friction: 9,
      tension: 55,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [zoom]);

  return (
    <View style={styles.screen}>
      <Animated.View style={[styles.homeContent, { transform: [{ scale: zoom }] }]}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>CLOUDBLOCK</Text>
            <Text style={styles.brandCaption}>A little closer, above the clouds.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onChangeBuilding}
            style={styles.signInButton}
          >
            <Text style={styles.signInText}>Change building</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.homeScroll}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.homeHero,
              { minHeight: Math.max(windowHeight * 0.62, 410) },
            ]}
          >
            <View style={styles.homeBuildingLabel}>
              <View style={styles.buildingPin} />
              <Text numberOfLines={1} style={styles.homeBuildingName}>
                {building?.name || "Choose your building"}
              </Text>
            </View>
            <View style={styles.introCopy}>
              <Text style={styles.eyebrow}>YOUR NEIGHBORS, JUST AROUND THE CORNER</Text>
              <Text style={styles.headline}>Find your people.</Text>
              <Text style={styles.subheadline}>
                Small moments make a building feel like home.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
      <IntroSplash />
    </View>
  );
}

const neighbors = [
  {
    buildingId: "cloudblock",
    floor: 12,
    name: "Maya Chen",
    apartment: "12A",
    bio: "Always looking for a tennis partner!",
    hobbies: ["Tennis", "Plants", "Pottery"],
    skin: "#C88462",
    shirt: "#F2AC72",
  },
  {
    buildingId: "willow",
    floor: 12,
    name: "Theo Brooks",
    apartment: "12C",
    bio: "Sunday pancakes are kind of my thing.",
    hobbies: ["Cooking", "Jazz", "Running"],
    skin: "#E6B58B",
    shirt: "#78A99C",
  },
  {
    buildingId: "cloudblock",
    floor: 9,
    name: "Imani Carter",
    apartment: "9B",
    bio: "New to the block—say hi anytime.",
    hobbies: ["Cycling", "Books", "Baking"],
    skin: "#754B3E",
    shirt: "#A38CC2",
  },
  {
    buildingId: "harbor",
    floor: 9,
    name: "Leo Alvarez",
    apartment: "9D",
    bio: "I know every good coffee spot nearby.",
    hobbies: ["Coffee", "Music", "Climbing"],
    skin: "#D59A72",
    shirt: "#6F91B3",
  },
  {
    buildingId: "cloudblock",
    floor: 6,
    name: "Nina Patel",
    apartment: "6A",
    bio: "Happy to trade herbs for good stories.",
    hobbies: ["Gardening", "Yoga", "Art"],
    skin: "#B97652",
    shirt: "#DA8E98",
  },
  {
    buildingId: "willow",
    floor: 6,
    name: "Sam Okafor",
    apartment: "6C",
    bio: "Looking for a buddy for morning walks.",
    hobbies: ["Walking", "Chess", "Films"],
    skin: "#5D3C32",
    shirt: "#D2A956",
  },
  {
    buildingId: "cloudblock",
    floor: 3,
    name: "Ellis Morgan",
    apartment: "3B",
    bio: "I make a very enthusiastic book club.",
    hobbies: ["Reading", "Knitting", "Tea"],
    skin: "#F0C39E",
    shirt: "#7297AE",
  },
  {
    buildingId: "harbor",
    floor: 3,
    name: "Jules Kim",
    apartment: "3D",
    bio: "Got a spare seat on my weekend hikes.",
    hobbies: ["Hiking", "Photography", "Dogs"],
    skin: "#D29A78",
    shirt: "#88A477",
  },
  {
    buildingId: "cloudblock",
    floor: 1,
    name: "Ari Williams",
    apartment: "1A",
    bio: "A friendly hello makes my whole day.",
    hobbies: ["Board games", "Baking", "Podcasts"],
    skin: "#8C5945",
    shirt: "#C28163",
  },
  {
    buildingId: "willow",
    floor: 1,
    name: "Robin Silva",
    apartment: "1C",
    bio: "Looking for neighbors to swap playlists.",
    hobbies: ["Music", "Drawing", "Cooking"],
    skin: "#E0AA82",
    shirt: "#849BC2",
  },
];

const communityPosts = [
  {
    id: "flour",
    buildingId: "cloudblock",
    type: "request",
    urgency: "urgent",
    text: "Can I borrow a cup of flour?",
    unit: "12A",
  },
  {
    id: "plants",
    buildingId: "willow",
    type: "offer",
    urgency: "normal",
    text: "Happy to water your plants this weekend",
    unit: "6A",
  },
  {
    id: "bike",
    buildingId: "harbor",
    type: "offer",
    urgency: "urgent",
    text: "Giving away a bicycle for free!",
    unit: "9D",
  },
  {
    id: "charger",
    buildingId: "cloudblock",
    type: "request",
    urgency: "normal",
    text: "Anyone have a USB-C charger I can borrow?",
    unit: "3B",
  },
  {
    id: "soup",
    buildingId: "willow",
    type: "offer",
    urgency: "casual",
    text: "Extra soup if anyone's feeling cozy",
    unit: "12C",
  },
  {
    id: "walk",
    buildingId: "harbor",
    type: "request",
    urgency: "casual",
    text: "Looking for a walking buddy",
    unit: "1A",
  },
  {
    id: "boxes",
    buildingId: "cloudblock",
    type: "request",
    urgency: "urgent",
    text: "Could someone lend me two moving boxes?",
    unit: "6C",
  },
  {
    id: "books",
    buildingId: "willow",
    type: "offer",
    urgency: "normal",
    text: "Free books—come pick your favorites",
    unit: "3D",
  },
];

function PageHeader({ title, building }) {
  return (
    <View style={styles.pageHeader}>
      <View>
        <Text style={styles.pageTitle}>{title}</Text>
        {building ? (
          <Text numberOfLines={1} style={styles.pageBuildingName}>
            {building.name}
          </Text>
        ) : null}
      </View>
      <View style={styles.pageHeaderMark}>
        <Text style={styles.pageHeaderMarkText}>CB</Text>
      </View>
    </View>
  );
}

function ClayNeighbor({ neighbor, index }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      delay: index * 65,
      friction: 8,
      tension: 55,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [entrance, index]);

  const translateX = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [34, 0],
  });
  const avatarStyle = {
    backgroundColor: neighbor.skin,
  };
  const shirtStyle = {
    backgroundColor: neighbor.shirt,
  };

  return (
    <Animated.View
      style={[
        styles.neighborCard,
        { opacity: entrance, transform: [{ translateX }] },
      ]}
    >
      <View style={styles.neighborCardTop}>
        <View style={styles.apartmentBadge}>
          <Text style={styles.apartmentBadgeText}>APT {neighbor.apartment}</Text>
        </View>
        <Text style={styles.neighborSparkle}>✦</Text>
      </View>
      <View style={styles.neighborPortrait}>
        <View style={[styles.personBody, shirtStyle]}>
          <View style={[styles.personNeck, avatarStyle]} />
          <View style={[styles.personHead, avatarStyle]}>
            <View style={styles.personHighlight} />
            <View style={styles.personEyes}>
              <View style={styles.personEye} />
              <View style={styles.personEye} />
            </View>
            <View style={styles.personSmile} />
          </View>
        </View>
        <View style={styles.portraitShine} />
      </View>
      <Text style={styles.neighborName}>{neighbor.name}</Text>
      <Text style={styles.neighborBio}>{neighbor.bio}</Text>
      <View style={styles.hobbyRow}>
        {neighbor.hobbies.map((hobby) => (
          <View key={hobby} style={styles.hobbyTag}>
            <Text style={styles.hobbyText}>{hobby}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.sayHelloButton}>
        <Text style={styles.sayHelloText}>Say hello</Text>
        <Text style={styles.sayHelloArrow}>↗</Text>
      </Pressable>
    </Animated.View>
  );
}

function ConnectScreen({ building }) {
  const buildingNeighbors = neighbors.filter(
    (neighbor) => neighbor.buildingId === building.id,
  );
  const floors = [...new Set(buildingNeighbors.map((neighbor) => neighbor.floor))].sort(
    (first, second) => second - first,
  );

  return (
    <View style={styles.screen}>
      <PageHeader title="Connect" building={building} />
      <ScrollView
        contentContainerStyle={styles.connectContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.communityIntro}>
          <Text style={styles.eyebrow}>GOOD THINGS LIVE NEXT DOOR</Text>
          <Text style={styles.communityTitle}>Meet your neighbors.</Text>
          <Text style={styles.communityDescription}>
            A familiar face makes a building feel like home.
          </Text>
          <View style={styles.neighborCount}>
            <Text style={styles.neighborCountText}>
              {buildingNeighbors.length} neighbors · {floors.length} floors
            </Text>
          </View>
        </View>
        {buildingNeighbors.length === 0 ? (
          <View style={styles.emptyCommunity}>
            <Text style={styles.emptyCommunityIcon}>✦</Text>
            <Text style={styles.emptyCommunityTitle}>A fresh start.</Text>
            <Text style={styles.emptyCommunityText}>
              There are no demo neighbor profiles for this building yet.
            </Text>
          </View>
        ) : null}
        {floors.map((floor) => {
          const floorNeighbors = buildingNeighbors.filter(
            (neighbor) => neighbor.floor === floor,
          );
          return (
            <View key={floor} style={styles.floorSection}>
              <View style={styles.floorHeading}>
                <View style={styles.floorPill}>
                  <Text style={styles.floorPillText}>
                    {String(floor).padStart(2, "0")}
                  </Text>
                </View>
                <Text style={styles.floorHeadingTitle}>Floor {floor}</Text>
                <Text style={styles.floorHeadingCount}>
                  {floorNeighbors.length} neighbors
                </Text>
              </View>
              <ScrollView
                horizontal
                contentContainerStyle={styles.neighborCarousel}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                snapToInterval={284}
              >
                {floorNeighbors.map((neighbor, index) => (
                  <ClayNeighbor
                    key={neighbor.apartment}
                    neighbor={neighbor}
                    index={index}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CommunityCloud({ post, index }) {
  const urgency = post.urgency;
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      delay: index * 75,
      friction: 8,
      tension: 52,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [entrance, index]);

  const scale = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  return (
    <Animated.View
      style={[
        styles.cloudPost,
        styles[`cloudPost_${post.type}`],
        styles[`cloudPost_${urgency}`],
        {
          opacity: entrance,
          transform: [
            { scale },
            { rotate: index % 2 === 0 ? "-2deg" : "2deg" },
          ],
        },
      ]}
    >
      <View style={styles.postCloudPuffLeft} />
      <View style={styles.postCloudPuffRight} />
      <Text style={styles.cloudPostType}>
        {post.type === "request" ? "NEED A HAND" : "HAPPY TO SHARE"}
      </Text>
      <Text style={styles.cloudPostText}>{post.text}</Text>
      <Text style={styles.cloudPostUnit}>APT {post.unit}</Text>
      {urgency === "urgent" ? (
        <View style={styles.urgentDot} />
      ) : null}
    </Animated.View>
  );
}

function ContributeScreen({ building }) {
  const [filter, setFilter] = useState("request");
  const [search, setSearch] = useState("");
  const buildingPosts = communityPosts.filter(
    (post) => post.buildingId === building.id,
  );
  const visiblePosts = buildingPosts.filter((post) => {
    const matchesType = post.type === filter;
    const query = search.trim().toLowerCase();
    return (
      matchesType &&
      (!query ||
        post.text.toLowerCase().includes(query) ||
        post.unit.toLowerCase().includes(query))
    );
  });

  return (
    <View style={styles.screen}>
      <PageHeader title="Community board" building={building} />
      <View style={styles.boardIntro}>
        <Text style={styles.eyebrow}>A LITTLE HELP GOES A LONG WAY</Text>
        <Text style={styles.communityTitle}>The cloud board.</Text>
        <Text style={styles.communityDescription}>
          Share what you need, or what you have to give.
        </Text>
      </View>
      <View style={styles.boardTabs}>
        {[
          { key: "request", label: "Requests", icon: "↗" },
          { key: "offer", label: "Offers", icon: "♡" },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === tab.key }}
            onPress={() => setFilter(tab.key)}
            style={[
              styles.boardTab,
              filter === tab.key && styles.boardTabSelected,
            ]}
          >
            <Text
              style={[
                styles.boardTabText,
                filter === tab.key && styles.boardTabTextSelected,
              ]}
            >
              {tab.icon} {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.cloudBoard}
        showsVerticalScrollIndicator={false}
      >
        {visiblePosts.length ? (
          visiblePosts.map((post, index) => (
            <CommunityCloud key={post.id} post={post} index={index} />
          ))
        ) : (
          <View style={styles.emptyBoard}>
            <Text style={styles.emptyBoardCloud}>☁</Text>
            <Text style={styles.emptyBoardTitle}>
              {buildingPosts.length ? "No clouds found" : "Clear skies for now"}
            </Text>
            <Text style={styles.emptyBoardText}>
              {buildingPosts.length
                ? "Try another search."
                : "There are no demo posts for this building yet."}
            </Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.boardSearchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          accessibilityLabel="Search community board"
          autoCapitalize="none"
          onChangeText={setSearch}
          placeholder={`Search ${filter === "request" ? "requests" : "offers"}…`}
          placeholderTextColor="#8AA4B7"
          returnKeyType="search"
          style={styles.searchInput}
          value={search}
        />
        {search ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearch("")}
            style={styles.clearSearch}
          >
            <Text style={styles.clearSearchText}>×</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BuildingPicker({
  visible,
  currentBuilding,
  error,
  saving,
  onCancel,
  onEnter,
}) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState(null);
  const normalizedQuery = query.trim().toLowerCase();
  const suggestions = DEMO_BUILDINGS.filter((building) =>
    `${building.name} ${building.address}`.toLowerCase().includes(normalizedQuery),
  );
  const isExactSuggestion = DEMO_BUILDINGS.some(
    (building) =>
      building.name.toLowerCase() === normalizedQuery ||
      building.address.toLowerCase() === normalizedQuery,
  );

  if (!visible) return null;

  function selectCustomAddress() {
    const address = query.trim();
    if (!address) return;
    const id = address.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    setSelection({
      id: `custom-${id}`,
      name: address,
      address,
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.pickerOverlay}
    >
      <View style={styles.pickerScrim} />
      <View style={styles.pickerCenter}>
        <View style={styles.pickerCard}>
          <View style={styles.pickerTopline}>
            <View style={styles.pickerIcon}>
              <Text style={styles.pickerIconText}>⌂</Text>
            </View>
            {currentBuilding ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={styles.pickerCancel}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.pickerEyebrow}>WELCOME TO THE NEIGHBORHOOD</Text>
          <Text style={styles.pickerTitle}>Find Your Building</Text>
          <Text style={styles.pickerDescription}>
            Search a demo building or enter your own address.
          </Text>
          <TextInput
            accessibilityLabel="Building name or address"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(value) => {
              setQuery(value);
              setSelection(null);
            }}
            placeholder="Building name or address"
            placeholderTextColor="#9A9AA0"
            returnKeyType="search"
            style={styles.pickerInput}
            value={query}
          />
          <Text style={styles.suggestionsLabel}>
            {normalizedQuery ? "MATCHING BUILDINGS" : "SUGGESTED BUILDINGS"}
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionList}
            contentContainerStyle={styles.suggestionListContent}
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((building) => {
              const isSelected = selection?.id === building.id;
              return (
                <Pressable
                  key={building.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => setSelection(building)}
                  style={[
                    styles.buildingSuggestion,
                    isSelected && styles.buildingSuggestionSelected,
                  ]}
                >
                  <View style={styles.suggestionPin}>
                    <View style={styles.suggestionPinCenter} />
                  </View>
                  <View style={styles.suggestionCopy}>
                    <Text style={styles.suggestionName}>{building.name}</Text>
                    <Text style={styles.suggestionAddress}>{building.address}</Text>
                  </View>
                  <Text style={styles.suggestionCheck}>
                    {isSelected ? "✓" : "›"}
                  </Text>
                </Pressable>
              );
            })}
            {normalizedQuery && !isExactSuggestion ? (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{
                  checked: selection?.id.startsWith("custom-") || false,
                }}
                onPress={selectCustomAddress}
                style={[
                  styles.buildingSuggestion,
                  selection?.id.startsWith("custom-") &&
                    styles.buildingSuggestionSelected,
                ]}
              >
                <View style={styles.suggestionPin}>
                  <View style={styles.suggestionPinCenter} />
                </View>
                <View style={styles.suggestionCopy}>
                  <Text style={styles.suggestionName}>Use this address</Text>
                  <Text numberOfLines={1} style={styles.suggestionAddress}>
                    {query.trim()}
                  </Text>
                </View>
                <Text style={styles.suggestionCheck}>
                  {selection?.id.startsWith("custom-") ? "✓" : "›"}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
          {error ? <Text style={styles.pickerError}>{error}</Text> : null}
          <Text style={styles.pickerDisclaimer}>
            Demo locations only. Entering an address does not verify residency
            or sign you in.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !selection || saving }}
            disabled={!selection || saving}
            onPress={() => onEnter(selection)}
            style={({ pressed }) => [
              styles.enterBuildingButton,
              (!selection || saving) && styles.enterBuildingButtonDisabled,
              pressed && selection && !saving && styles.buttonPressed,
            ]}
          >
            <Text style={styles.enterBuildingText}>
              {saving ? "Saving…" : "Enter Building"}
            </Text>
            <Text style={styles.enterBuildingArrow}>→</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function BottomNavigation({ activeTab, onSelect, bottomInset }) {
  const tabs = [
    { key: "home", label: "Home", icon: "⌂" },
    { key: "connect", label: "Connect", icon: "◉" },
    { key: "contribute", label: "Contribute", icon: "☁" },
  ];

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bottomNavigation, { paddingBottom: Math.max(bottomInset, 9) }]}
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(tab.key)}
            style={styles.navigationTab}
          >
            <View
              style={[
                styles.navigationIndicator,
                selected && styles.navigationIndicatorActive,
              ]}
            />
            <Text
              style={[
                styles.navigationIcon,
                selected && styles.navigationIconActive,
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.navigationLabel,
                selected && styles.navigationLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CloudBlockApp() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("home");
  const [building, setBuilding] = useState(null);
  const [targetTab, setTargetTab] = useState("home");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [savingBuilding, setSavingBuilding] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreBuilding() {
      try {
        const saved = await AsyncStorage.getItem(BUILDING_STORAGE_KEY);
        if (!active) return;
        if (saved === null) {
          setPickerVisible(true);
          return;
        }

        const value = JSON.parse(saved);
        if (
          !value ||
          typeof value.id !== "string" ||
          typeof value.name !== "string" ||
          typeof value.address !== "string"
        ) {
          throw new Error("Saved building data is invalid.");
        }
        setBuilding(value);
      } catch (error) {
        console.error("Could not restore the selected building.", error);
        if (active) {
          setBuilding(null);
          setPickerVisible(true);
          setStorageError(
            "We couldn't load the saved building. Choose it again to continue.",
          );
        }
      } finally {
        if (active) setStorageReady(true);
      }
    }

    restoreBuilding();
    return () => {
      active = false;
    };
  }, []);

  function selectTab(tab) {
    if (tab !== "home" && !building) {
      setTargetTab(tab);
      setPickerVisible(true);
      return;
    }
    setActiveTab(tab);
  }

  function openBuildingPicker() {
    setTargetTab(activeTab);
    setPickerVisible(true);
  }

  async function enterBuilding(selection) {
    if (!selection || savingBuilding) return;
    setSavingBuilding(true);
    setStorageError("");
    try {
      await AsyncStorage.setItem(
        BUILDING_STORAGE_KEY,
        JSON.stringify(selection),
      );
      setBuilding(selection);
      setActiveTab(targetTab);
      setPickerVisible(false);
    } catch (error) {
      console.error("Could not save the selected building.", error);
      setStorageError(
        "We couldn't save that building. Check device storage and try again.",
      );
    } finally {
      setSavingBuilding(false);
    }
  }

  const isHome = activeTab === "home";

  return (
    <View style={styles.app}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      {isHome ? (
        <ImageBackground
          pointerEvents="none"
          source={require("./assets/images/skyscraper.png")}
          resizeMode="cover"
          style={styles.fullScreenBackground}
        />
      ) : (
        <View pointerEvents="none" style={styles.nonHomeBackground} />
      )}
      {isHome ? (
        <View pointerEvents="none" style={styles.backgroundOverlay} />
      ) : null}

      <SafeAreaView
        edges={["top", "left", "right"]}
        style={styles.safeArea}
      >
        <View style={styles.appContent}>
          <View style={styles.tabContent}>
            {isHome || !building ? (
              <HomeScreen
                building={building}
                onChangeBuilding={openBuildingPicker}
              />
            ) : activeTab === "connect" ? (
              <ConnectScreen building={building} />
            ) : (
              <ContributeScreen building={building} />
            )}
          </View>
          <BottomNavigation
            activeTab={activeTab}
            onSelect={selectTab}
            bottomInset={insets.bottom}
          />
        </View>
      </SafeAreaView>

      {!storageReady ? (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingBrand}>CLOUDBLOCK</Text>
          <Text style={styles.loadingMessage}>Finding your place…</Text>
        </View>
      ) : null}
      <BuildingPicker
        visible={storageReady && pickerVisible}
        currentBuilding={building}
        error={storageError}
        saving={savingBuilding}
        onCancel={() => setPickerVisible(false)}
        onEnter={enterBuilding}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CloudBlockApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#080B10",
  },
  fullScreenBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  nonHomeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#090D13",
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 7, 12, 0.28)",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  appContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  tabContent: {
    flex: 1,
  },
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  homeContent: {
    flex: 1,
  },
  topBar: {
    minHeight: 66,
    paddingHorizontal: 22,
    paddingTop: 9,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: "#FFF9EF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  brandCaption: {
    marginTop: 4,
    color: "#D1D0CD",
    fontSize: 11,
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
    backgroundColor: "rgba(13, 17, 22, 0.62)",
  },
  signInText: {
    color: "#F2C174",
    fontSize: 12,
    fontWeight: "700",
  },
  homeScroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: "center",
  },
  homeHero: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  homeBuildingLabel: {
    maxWidth: "92%",
    minHeight: 31,
    marginBottom: 22,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(9, 13, 18, 0.52)",
  },
  buildingPin: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F2B864",
  },
  homeBuildingName: {
    color: "#D8D6D1",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  introCopy: {
    width: "100%",
    marginBottom: 25,
    alignItems: "center",
  },
  eyebrow: {
    color: "#EDB66A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    textAlign: "center",
  },
  headline: {
    marginTop: 8,
    color: "#FFF8EE",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  subheadline: {
    maxWidth: 290,
    marginTop: 7,
    color: "#D2D1CE",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  introLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cloudPuff: {
    position: "absolute",
    width: 96,
    height: 48,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.75,
    shadowRadius: 12,
    elevation: 5,
  },
  cloudTopLeft: {
    top: "16%",
    left: "7%",
  },
  cloudTopRight: {
    top: "20%",
    right: "5%",
  },
  cloudMidLeft: {
    top: "43%",
    left: "1%",
  },
  cloudMidRight: {
    top: "48%",
    right: "1%",
  },
  cloudBottom: {
    bottom: "18%",
    left: "34%",
  },
  cloudPuffBase: {
    position: "absolute",
    left: 10,
    right: 8,
    bottom: 3,
    height: 25,
    borderRadius: 15,
    backgroundColor: "rgba(190, 199, 207, 0.47)",
  },
  cloudPuffLeft: {
    position: "absolute",
    left: 15,
    bottom: 10,
    width: 29,
    height: 29,
    borderRadius: 16,
    backgroundColor: "rgba(206, 214, 221, 0.55)",
  },
  cloudPuffCenter: {
    position: "absolute",
    left: 34,
    bottom: 13,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "rgba(206, 214, 221, 0.60)",
  },
  cloudPuffRight: {
    position: "absolute",
    right: 12,
    bottom: 8,
    width: 27,
    height: 27,
    borderRadius: 15,
    backgroundColor: "rgba(190, 199, 207, 0.50)",
  },
  cloudMark: {
    zIndex: 1,
    paddingHorizontal: 31,
    paddingVertical: 23,
    borderRadius: 40,
    backgroundColor: "rgba(11, 15, 20, 0.87)",
    borderWidth: 1,
    borderColor: "rgba(242, 182, 92, 0.40)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 12,
  },
  cloudMarkText: {
    color: "#FFF4E4",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1.5,
    textShadowColor: "rgba(238, 167, 73, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  pageHeader: {
    minHeight: 70,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageHeaderMark: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(243, 181, 91, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(243, 181, 91, 0.35)",
  },
  pageHeaderMarkText: {
    color: "#E9B56B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  pageTitle: {
    color: "#F5F1EB",
    fontSize: 23,
    fontWeight: "900",
  },
  pageBuildingName: {
    maxWidth: 280,
    marginTop: 3,
    color: "#A6A39E",
    fontSize: 11,
  },
  connectContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  communityIntro: {
    marginTop: 8,
    marginBottom: 22,
    alignItems: "center",
  },
  communityTitle: {
    marginTop: 7,
    color: "#F3EEE6",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  communityDescription: {
    maxWidth: 300,
    marginTop: 7,
    color: "#A9A7A2",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  neighborCount: {
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 13,
    backgroundColor: "rgba(243, 181, 91, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(243, 181, 91, 0.2)",
  },
  neighborCountText: {
    color: "#E5BC7F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  floorSection: {
    marginBottom: 22,
  },
  floorHeading: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  floorPill: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(232, 175, 91, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(232, 175, 91, 0.34)",
  },
  floorPillText: {
    color: "#F0C27B",
    fontSize: 10,
    fontWeight: "900",
  },
  floorHeadingTitle: {
    flex: 1,
    color: "#ECE8E2",
    fontSize: 15,
    fontWeight: "800",
  },
  floorHeadingCount: {
    color: "#888985",
    fontSize: 10,
  },
  neighborCarousel: {
    paddingRight: 10,
  },
  neighborCard: {
    width: 270,
    minHeight: 354,
    marginRight: 14,
    padding: 16,
    overflow: "hidden",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(234, 224, 206, 0.16)",
    backgroundColor: "rgba(24, 27, 31, 0.92)",
  },
  neighborCardTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  apartmentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(231, 173, 90, 0.12)",
  },
  apartmentBadgeText: {
    color: "#E7B76F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  neighborSparkle: {
    color: "#DBAD6C",
    fontSize: 17,
  },
  neighborPortrait: {
    width: 102,
    height: 102,
    marginTop: 14,
    marginBottom: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    borderRadius: 33,
    backgroundColor: "#303841",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  personBody: {
    width: 82,
    height: 47,
    marginBottom: -1,
    alignItems: "center",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  personNeck: {
    position: "absolute",
    top: -9,
    width: 22,
    height: 22,
    borderRadius: 9,
    backgroundColor: "#C88462",
  },
  personHead: {
    position: "absolute",
    top: -46,
    width: 55,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 5,
    elevation: 4,
  },
  personHighlight: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 15,
    height: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 239, 218, 0.22)",
    transform: [{ rotate: "-30deg" }],
  },
  personEyes: {
    width: 26,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  personEye: {
    width: 3,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#33251F",
  },
  personSmile: {
    width: 10,
    height: 5,
    marginTop: 5,
    borderBottomWidth: 1.5,
    borderColor: "#58392D",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  portraitShine: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  neighborName: {
    color: "#F4EEE5",
    fontSize: 17,
    fontWeight: "900",
  },
  neighborBio: {
    minHeight: 36,
    marginTop: 6,
    color: "#B7B2A9",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  hobbyRow: {
    marginTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },
  hobbyTag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(202, 209, 214, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(202, 209, 214, 0.12)",
  },
  hobbyText: {
    color: "#CAC5BC",
    fontSize: 9,
    fontWeight: "700",
  },
  sayHelloButton: {
    width: "100%",
    minHeight: 39,
    marginTop: "auto",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 13,
    backgroundColor: "rgba(229, 174, 95, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(229, 174, 95, 0.23)",
  },
  sayHelloText: {
    color: "#E9BD7D",
    fontSize: 11,
    fontWeight: "800",
  },
  sayHelloArrow: {
    color: "#E9BD7D",
    fontSize: 14,
  },
  emptyCommunity: {
    marginTop: 18,
    padding: 25,
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.13)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyCommunityIcon: {
    color: "#E4B66F",
    fontSize: 23,
  },
  emptyCommunityTitle: {
    marginTop: 8,
    color: "#EFEAE2",
    fontSize: 17,
    fontWeight: "800",
  },
  emptyCommunityText: {
    marginTop: 6,
    color: "#A6A39D",
    fontSize: 12,
    textAlign: "center",
  },
  boardIntro: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 17,
    alignItems: "center",
  },
  boardTabs: {
    marginHorizontal: 22,
    marginBottom: 8,
    padding: 4,
    flexDirection: "row",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.045)",
  },
  boardTab: {
    flex: 1,
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  boardTabSelected: {
    backgroundColor: "rgba(236, 177, 91, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(236, 177, 91, 0.27)",
  },
  boardTabText: {
    color: "#9E9B95",
    fontSize: 12,
    fontWeight: "700",
  },
  boardTabTextSelected: {
    color: "#E9BC78",
  },
  cloudBoard: {
    paddingHorizontal: 17,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  cloudPost: {
    minHeight: 118,
    paddingHorizontal: 17,
    paddingVertical: 16,
    overflow: "hidden",
    justifyContent: "center",
    borderRadius: 32,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  cloudPost_request: {
    backgroundColor: "rgba(90, 66, 45, 0.92)",
    borderColor: "rgba(245, 186, 105, 0.45)",
  },
  cloudPost_offer: {
    backgroundColor: "rgba(38, 51, 57, 0.94)",
    borderColor: "rgba(166, 190, 188, 0.36)",
  },
  cloudPost_urgent: {
    width: "92%",
    minHeight: 145,
  },
  cloudPost_normal: {
    width: "75%",
    minHeight: 125,
  },
  cloudPost_casual: {
    width: "62%",
    minHeight: 110,
  },
  postCloudPuffLeft: {
    position: "absolute",
    top: -17,
    left: 17,
    width: 53,
    height: 42,
    borderRadius: 28,
    backgroundColor: "rgba(255, 239, 216, 0.07)",
  },
  postCloudPuffRight: {
    position: "absolute",
    right: 6,
    bottom: -19,
    width: 72,
    height: 47,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.045)",
  },
  cloudPostType: {
    color: "#E6BB7C",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  cloudPostText: {
    marginTop: 7,
    color: "#FFF6E9",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
  },
  cloudPostUnit: {
    marginTop: 9,
    color: "#C5B49C",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  urgentDot: {
    position: "absolute",
    top: 15,
    right: 17,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E9A44F",
  },
  emptyBoard: {
    flex: 1,
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBoardCloud: {
    color: "#C6A36D",
    fontSize: 43,
  },
  emptyBoardTitle: {
    marginTop: 8,
    color: "#ECE7DF",
    fontSize: 17,
    fontWeight: "800",
  },
  emptyBoardText: {
    marginTop: 6,
    color: "#9D9A94",
    fontSize: 12,
    textAlign: "center",
  },
  boardSearchBar: {
    minHeight: 50,
    marginHorizontal: 18,
    marginTop: 7,
    marginBottom: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    backgroundColor: "rgba(255, 255, 255, 0.075)",
  },
  searchIcon: {
    marginRight: 10,
    color: "#E6B76F",
    fontSize: 25,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#F4EEE5",
    fontSize: 13,
  },
  clearSearch: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  clearSearchText: {
    color: "#BDB6AC",
    fontSize: 21,
  },
  bottomNavigation: {
    minHeight: 67,
    paddingTop: 5,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    backgroundColor: "rgba(7, 9, 12, 0.90)",
    borderTopWidth: 1,
    borderTopColor: "rgba(236, 181, 103, 0.18)",
  },
  navigationTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  navigationIndicator: {
    width: 24,
    height: 2,
    marginBottom: 5,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  navigationIndicatorActive: {
    backgroundColor: "#F0B55F",
    shadowColor: "#F0B55F",
    shadowOpacity: 0.9,
    shadowRadius: 7,
    elevation: 3,
  },
  navigationIcon: {
    color: "#85827D",
    fontSize: 17,
  },
  navigationIconActive: {
    color: "#F0B55F",
  },
  navigationLabel: {
    marginTop: 2,
    color: "#99958F",
    fontSize: 10,
    fontWeight: "600",
  },
  navigationLabelActive: {
    color: "#F3D09B",
    fontWeight: "800",
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "center",
  },
  pickerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 5, 8, 0.78)",
  },
  pickerCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "100%",
    alignSelf: "center",
    padding: 22,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(242, 197, 131, 0.32)",
    backgroundColor: "rgba(22, 24, 27, 0.97)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 18,
  },
  pickerTopline: {
    minHeight: 43,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(238, 177, 96, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(238, 177, 96, 0.28)",
  },
  pickerIconText: {
    color: "#F2C17A",
    fontSize: 21,
    fontWeight: "800",
  },
  pickerCancel: {
    padding: 9,
  },
  pickerCancelText: {
    color: "#C5B7A1",
    fontSize: 12,
    fontWeight: "700",
  },
  pickerEyebrow: {
    color: "#D8AC6C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  pickerTitle: {
    marginTop: 7,
    color: "#FFF7EC",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  pickerDescription: {
    marginTop: 7,
    marginBottom: 18,
    color: "#B7B2A9",
    fontSize: 13,
    lineHeight: 19,
  },
  pickerInput: {
    minHeight: 50,
    marginBottom: 17,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.17)",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    color: "#FFF6E9",
    fontSize: 14,
  },
  suggestionsLabel: {
    marginBottom: 8,
    color: "#938F88",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  suggestionList: {
    flexGrow: 0,
    minHeight: 50,
    maxHeight: 180,
  },
  suggestionListContent: {
    gap: 7,
  },
  buildingSuggestion: {
    minHeight: 57,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.085)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  buildingSuggestionSelected: {
    borderColor: "rgba(237, 177, 94, 0.56)",
    backgroundColor: "rgba(220, 159, 78, 0.13)",
  },
  suggestionPin: {
    width: 30,
    height: 30,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(242, 183, 103, 0.12)",
  },
  suggestionPinCenter: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E9B365",
  },
  suggestionCopy: {
    flex: 1,
  },
  suggestionName: {
    color: "#F0ECE5",
    fontSize: 12,
    fontWeight: "800",
  },
  suggestionAddress: {
    marginTop: 3,
    color: "#A7A29A",
    fontSize: 10,
  },
  suggestionCheck: {
    marginHorizontal: 5,
    color: "#E8B46A",
    fontSize: 18,
  },
  pickerError: {
    marginTop: 10,
    color: "#FFAA8F",
    fontSize: 11,
    lineHeight: 16,
  },
  pickerDisclaimer: {
    marginTop: 13,
    color: "#918D86",
    fontSize: 10,
    lineHeight: 15,
  },
  enterBuildingButton: {
    minHeight: 50,
    marginTop: 16,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    backgroundColor: "#D89C51",
  },
  enterBuildingButtonDisabled: {
    backgroundColor: "rgba(216, 156, 81, 0.27)",
  },
  enterBuildingText: {
    color: "#1E1812",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  enterBuildingArrow: {
    color: "#1E1812",
    fontSize: 19,
    fontWeight: "700",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#090D13",
  },
  loadingBrand: {
    color: "#F3E9D9",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: 3,
  },
  loadingMessage: {
    marginTop: 8,
    color: "#B8A88F",
    fontSize: 12,
  },
});
